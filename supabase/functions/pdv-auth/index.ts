import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

function getCorsHeaders(req: Request) {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "*";
  const origins = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get("Origin");
  const allowOrigin = (origin && origins.includes(origin)) ? origin : (raw === "*" ? "*" : (origins[0] ?? "*"));
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const BodySchema = z
  .object({
    action: z.enum(["init", "terminals", "operators", "login"]),

    // terminals + operators + login (optional now - will fetch first tenant if not provided)
    tenant_id: z.string().uuid().optional(),

    // login
    terminal_id: z.string().uuid().optional(),
    operator_id: z.string().uuid().optional(),
    pin: z.string().min(1).max(6).optional(),
  })
  .strict();

type Body = z.infer<typeof BodySchema>;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let body: Body;
    try {
      body = BodySchema.parse(await req.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: "Dados inválidos", details: err.errors }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw err;
    }

    // Init: Get first tenant + terminals + operators
    if (body.action === "init") {
      // Get first active tenant
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from("tenants")
        .select("id, name, slug, logo_url")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (tenantError) throw tenantError;
      if (!tenant) {
        return new Response(JSON.stringify({ error: "Nenhuma empresa configurada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch terminals and operators in parallel
      const [terminalsResult, operatorsResult] = await Promise.all([
        supabaseAdmin
          .from("pdv_terminals")
          .select("id, code, name")
          .eq("tenant_id", tenant.id)
          .eq("is_active", true)
          .order("code"),
        supabaseAdmin
          .from("pdv_operators")
          .select("id, code, name")
          .eq("tenant_id", tenant.id)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (terminalsResult.error) throw terminalsResult.error;
      if (operatorsResult.error) throw operatorsResult.error;

      return new Response(
        JSON.stringify({
          tenant,
          terminals: terminalsResult.data ?? [],
          operators: operatorsResult.data ?? [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body.action === "terminals") {
      if (!body.tenant_id) {
        return new Response(JSON.stringify({ error: "tenant_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: terminals, error } = await supabaseAdmin
        .from("pdv_terminals")
        .select("id, code, name")
        .eq("tenant_id", body.tenant_id)
        .eq("is_active", true)
        .order("code");

      if (error) throw error;

      return new Response(JSON.stringify({ terminals: terminals ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "operators") {
      if (!body.tenant_id) {
        return new Response(JSON.stringify({ error: "tenant_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: operators, error } = await supabaseAdmin
        .from("pdv_operators")
        .select("id, code, name")
        .eq("tenant_id", body.tenant_id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      return new Response(JSON.stringify({ operators: operators ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // login
    if (!body.tenant_id || !body.terminal_id || !body.operator_id || !body.pin) {
      return new Response(
        JSON.stringify({ error: "tenant_id, terminal_id, operator_id e pin são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const [{ data: terminal, error: terminalError }, { data: operator, error: operatorError }] =
      await Promise.all([
        supabaseAdmin
          .from("pdv_terminals")
          .select("id, code, name, tenant_id, is_active")
          .eq("id", body.terminal_id)
          .eq("tenant_id", body.tenant_id)
          .maybeSingle(),
        supabaseAdmin
          .from("pdv_operators")
          .select("id, code, name, is_active, can_cancel_sale, can_give_discount, max_discount_percent, tenant_id")
          .eq("id", body.operator_id)
          .eq("tenant_id", body.tenant_id)
          .eq("is_active", true)
          .maybeSingle(),
      ]);

    if (terminalError) throw terminalError;
    if (operatorError) throw operatorError;

    if (!terminal || !terminal.is_active) {
      return new Response(JSON.stringify({ error: "Terminal inválido ou inativo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!operator) {
      return new Response(JSON.stringify({ error: "Operador não encontrado ou inativo" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pinValid } = await supabaseAdmin.rpc("verify_pdv_operator_pin", {
      _operator_id: body.operator_id,
      _plain_pin: body.pin,
    });
    if (!pinValid) {
      return new Response(JSON.stringify({ error: "PIN incorreto" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Do not return the pin
    const safeOperator = {
      id: operator.id,
      code: operator.code,
      name: operator.name,
      can_cancel_sale: operator.can_cancel_sale,
      can_give_discount: operator.can_give_discount,
      max_discount_percent: operator.max_discount_percent,
    };

    const safeTerminal = {
      id: terminal.id,
      code: terminal.code,
      name: terminal.name,
    };

    return new Response(JSON.stringify({ operator: safeOperator, terminal: safeTerminal }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("pdv-auth error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
