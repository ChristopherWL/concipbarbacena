import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schemas for input validation
const StockEntryItemSchema = z.object({
  product_id: z.string().uuid("ID do produto inválido"),
  quantity: z.number().int().positive("Quantidade deve ser positiva"),
  unit_price: z.number().nonnegative("Preço unitário deve ser não-negativo"),
  total_price: z.number().nonnegative("Preço total deve ser não-negativo"),
  cfop: z.string().max(10).optional().nullable(),
  ncm: z.string().max(20).optional().nullable(),
  serial_numbers: z.array(z.string().max(100)).optional(),
});

const StockEntryInputSchema = z.object({
  invoice: z.object({
    invoice_number: z.string().min(1, "Número da nota é obrigatório").max(50),
    invoice_series: z.string().max(10).optional().nullable(),
    invoice_key: z.string().max(44).optional().nullable(),
    issue_date: z.string().min(1, "Data de emissão é obrigatória"),
    supplier_id: z.string().uuid().optional().nullable(),
    total_value: z.number().nonnegative().optional().nullable(),
    discount: z.number().nonnegative().optional().nullable(),
    freight: z.number().nonnegative().optional().nullable(),
    taxes: z.number().nonnegative().optional().nullable(),
    notes: z.string().optional().nullable(),
    pdf_url: z.string().url().optional().nullable(),
    branch_id: z.string().uuid().optional().nullable(),
  }),
  items: z.array(StockEntryItemSchema).min(1, "Pelo menos um item é necessário"),
  signature_data: z.string().optional().nullable(),
});

type StockEntryInput = z.infer<typeof StockEntryInputSchema>;
type StockEntryItem = z.infer<typeof StockEntryItemSchema>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id, selected_branch_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error("Tenant not found");
    }

    const tenantId = profile.tenant_id;
    const userBranchId = profile.selected_branch_id;
    
    let parsedInput: StockEntryInput;
    try {
      const rawInput = await req.json();
      parsedInput = StockEntryInputSchema.parse(rawInput);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        console.error("Validation errors:", errorMessages);
        return new Response(
          JSON.stringify({ error: "Dados inválidos", details: errorMessages }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw err;
    }

    const { invoice, items, signature_data } = parsedInput;
    const effectiveBranchId = invoice.branch_id ?? userBranchId;

    const validatedItems: Array<{
      product: any;
      item: StockEntryItem;
    }> = [];

    for (const item of items) {
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", item.product_id)
        .eq("tenant_id", tenantId)
        .single();

      if (productError || !product) {
        throw new Error(`Produto não encontrado: ${item.product_id}`);
      }

      if (product.is_serialized && item.serial_numbers?.length) {
        if (item.serial_numbers.length !== item.quantity) {
          throw new Error(
            `Quantidade de números de série (${item.serial_numbers.length}) não corresponde à quantidade (${item.quantity}) para ${product.name}`
          );
        }

        const uniqueSerials = new Set(item.serial_numbers);
        if (uniqueSerials.size !== item.serial_numbers.length) {
          throw new Error(`Números de série duplicados na entrada para ${product.name}`);
        }

        for (const serial of item.serial_numbers) {
          const { data: existing } = await supabaseAdmin
            .from("serial_numbers")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("product_id", item.product_id)
            .eq("serial_number", serial)
            .maybeSingle();

          if (existing) {
            throw new Error(`Número de série "${serial}" já existe para ${product.name}`);
          }
        }
      }

      validatedItems.push({ product, item });
    }

    const createdIds: {
      invoice_id?: string;
      invoice_item_ids: string[];
      serial_number_ids: string[];
      movement_ids: string[];
      product_stock_updates: Array<{ id: string; previous_stock: number }>;
    } = {
      invoice_item_ids: [],
      serial_number_ids: [],
      movement_ids: [],
      product_stock_updates: [],
    };

    try {
      const { data: newInvoice, error: invoiceError } = await supabaseAdmin
        .from("invoices")
        .insert({
          ...invoice,
          tenant_id: tenantId,
          branch_id: effectiveBranchId,
          created_by: user.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;
      createdIds.invoice_id = newInvoice.id;

      for (const { product, item } of validatedItems) {
        const { data: invoiceItem, error: itemError } = await supabaseAdmin
          .from("invoice_items")
          .insert({
            invoice_id: newInvoice.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            cfop: item.cfop,
            ncm: item.ncm,
          })
          .select()
          .single();

        if (itemError) throw itemError;
        createdIds.invoice_item_ids.push(invoiceItem.id);

        if (product.is_serialized && item.serial_numbers?.length) {
          for (const serial of item.serial_numbers) {
            const { data: serialRecord, error: serialError } = await supabaseAdmin
              .from("serial_numbers")
              .insert({
                tenant_id: tenantId,
                product_id: item.product_id,
                invoice_item_id: invoiceItem.id,
                serial_number: serial,
                status: "disponivel",
                purchase_date: invoice.issue_date,
              })
              .select()
              .single();

            if (serialError) throw serialError;
            createdIds.serial_number_ids.push(serialRecord.id);
          }
        }

        const previousStock = product.current_stock || 0;
        createdIds.product_stock_updates.push({
          id: product.id,
          previous_stock: previousStock,
        });

        const newStock = previousStock + item.quantity;
        const { data: movement, error: movementError } = await supabaseAdmin
          .from("stock_movements")
          .insert({
            tenant_id: tenantId,
            branch_id: effectiveBranchId,
            product_id: item.product_id,
            invoice_id: newInvoice.id,
            movement_type: "entrada",
            quantity: item.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            unit_cost: item.unit_price,
            reason: `Entrada NF ${invoice.invoice_number}`,
            created_by: user.id,
          })
          .select()
          .single();

        if (movementError) throw movementError;
        createdIds.movement_ids.push(movement.id);

        const { error: updateError } = await supabaseAdmin
          .from("products")
          .update({
            current_stock: newStock,
            cost_price: item.unit_price,
          })
          .eq("id", item.product_id);

        if (updateError) throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, invoice_id: newInvoice.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (executionError) {
      console.error("Execution error, rolling back:", executionError);

      for (const update of createdIds.product_stock_updates) {
        await supabaseAdmin
          .from("products")
          .update({ current_stock: update.previous_stock })
          .eq("id", update.id);
      }

      if (createdIds.movement_ids.length) {
        await supabaseAdmin
          .from("stock_movements")
          .delete()
          .in("id", createdIds.movement_ids);
      }

      if (createdIds.serial_number_ids.length) {
        await supabaseAdmin
          .from("serial_numbers")
          .delete()
          .in("id", createdIds.serial_number_ids);
      }

      if (createdIds.invoice_item_ids.length) {
        await supabaseAdmin
          .from("invoice_items")
          .delete()
          .in("id", createdIds.invoice_item_ids);
      }

      if (createdIds.invoice_id) {
        await supabaseAdmin
          .from("invoices")
          .delete()
          .eq("id", createdIds.invoice_id);
      }

      throw executionError;
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
