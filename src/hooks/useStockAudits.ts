import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type StockAuditType = 'defeito' | 'furto' | 'garantia' | 'inventario';
export type StockAuditStatus = 'aberto' | 'em_analise' | 'resolvido' | 'cancelado' | 'enviado' | 'recebido';

export interface StockAudit {
  id: string;
  tenant_id: string;
  product_id: string;
  serial_number_id: string | null;
  audit_type: StockAuditType;
  status: StockAuditStatus;
  quantity: number;
  description: string;
  evidence_urls: string[];
  reported_by: string | null;
  reported_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    code: string;
    category: string;
  };
  serial_number?: {
    id: string;
    serial_number: string;
  };
}

export interface CreateStockAuditData {
  product_id: string;
  serial_number_id?: string | null;
  audit_type: StockAuditType;
  quantity: number;
  description: string;
  evidence_urls?: string[];
  status?: StockAuditStatus;
}

export interface UpdateStockAuditData {
  id: string;
  status?: StockAuditStatus;
  resolution_notes?: string;
  return_to_stock?: boolean;
  quantity?: number;
  product_id?: string;
  serial_number_id?: string | null;
}

export function useStockAudits(filters?: { 
  audit_type?: StockAuditType; 
  status?: StockAuditStatus;
  product_id?: string;
}) {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['stock-audits', tenant?.id, filters],
    queryFn: async () => {
      if (!tenant?.id) return [];

      let query = supabase
        .from('stock_audits')
        .select(`
          *,
          product:products(id, name, code, category),
          serial_number:serial_numbers(id, serial_number)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (filters?.audit_type) {
        query = query.eq('audit_type', filters.audit_type as any);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as StockAudit[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateStockAudit() {
  const queryClient = useQueryClient();
  const { tenant, user } = useAuthContext();

  return useMutation({
    mutationFn: async (data: CreateStockAuditData) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');

      const { data: audit, error } = await supabase
        .from('stock_audits')
        .insert({
          tenant_id: tenant.id,
          product_id: data.product_id,
          serial_number_id: data.serial_number_id || null,
          audit_type: data.audit_type as any,
          quantity: data.quantity,
          description: data.description,
          evidence_urls: data.evidence_urls || [],
          reported_by: user?.id,
          status: data.status || 'aberto',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return audit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-audits'] });
      toast.success('Auditoria registrada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao registrar auditoria: ' + error.message);
    },
  });
}

export function useUpdateStockAudit() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (data: UpdateStockAuditData) => {
      const updateData: any = {};
      
      if (data.status) {
        updateData.status = data.status;
        if (data.status === 'resolvido') {
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by = user?.id;
        }
      }
      if (data.resolution_notes !== undefined) {
        updateData.resolution_notes = data.resolution_notes;
      }

      const { data: audit, error } = await supabase
        .from('stock_audits')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;

      // If returning to stock, update product stock and serial number status
      if (data.return_to_stock && data.quantity && data.product_id) {
        // Update product current_stock
        const { data: product } = await supabase
          .from('products')
          .select('current_stock')
          .eq('id', data.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ current_stock: (product.current_stock || 0) + data.quantity })
            .eq('id', data.product_id);
        }

        // If has serial number, update status to disponivel
        if (data.serial_number_id) {
          await supabase
            .from('serial_numbers')
            .update({ status: 'disponivel' })
            .eq('id', data.serial_number_id);
        }
      }

      return audit;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-audits'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['serial-numbers'] });
      if (variables.return_to_stock) {
        toast.success('Item retornado ao estoque com sucesso');
      } else {
        toast.success('Auditoria atualizada com sucesso');
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar auditoria: ' + error.message);
    },
  });
}

export function useDeleteStockAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_audits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-audits'] });
      toast.success('Auditoria removida com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover auditoria: ' + error.message);
    },
  });
}
