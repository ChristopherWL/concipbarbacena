import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem, SerialNumber } from '@/types/stock';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';

export function useInvoices() {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['invoices', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(*),
          items:invoice_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

interface CreateInvoiceInput {
  invoice: Omit<Invoice, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'entry_date' | 'items'>;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    cfop?: string;
    ncm?: string;
    serial_numbers?: string[];
  }>;
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { tenant, user } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async ({ invoice, items }: CreateInvoiceInput) => {
      if (!tenant?.id || !user?.id) throw new Error('Dados não encontrados');
      
      // Add branch_id to invoice if user is branch-scoped
      const invoiceWithBranch = {
        ...invoice,
        branch_id: (invoice as any).branch_id ?? (shouldFilter ? branchId : null),
      };

      // Use edge function for transactional safety
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sessão expirada');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stock-entry`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ invoice: invoiceWithBranch, items }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar entrada');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['serial_numbers'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      toast.success('Nota fiscal cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar: ' + error.message);
    },
  });
}

// Standalone invoice creation (without items - direct insert)
interface CreateStandaloneInvoiceInput {
  invoice_number: string;
  invoice_series?: string;
  invoice_key?: string;
  issue_date: string;
  supplier_id?: string;
  total_value?: number;
  notes?: string;
  pdf_url?: string;
}

export function useCreateStandaloneInvoice() {
  const queryClient = useQueryClient();
  const { tenant, user } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (input: CreateStandaloneInvoiceInput) => {
      if (!tenant?.id || !user?.id) throw new Error('Dados não encontrados');
      
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          tenant_id: tenant.id,
          branch_id: shouldFilter ? branchId : null,
          invoice_number: input.invoice_number,
          invoice_series: input.invoice_series || null,
          invoice_key: input.invoice_key || null,
          issue_date: input.issue_date,
          supplier_id: input.supplier_id || null,
          total_value: input.total_value || 0,
          notes: input.notes || null,
          pdf_url: input.pdf_url || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal_coupons'] });
      queryClient.invalidateQueries({ queryKey: ['supplier_coupons_nf'] });
      toast.success('Nota fiscal avulsa cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar: ' + error.message);
    },
  });
}
