import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type StockAuditType = 'defeito' | 'furto' | 'garantia' | 'inventario' | 'resolucao';
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
  parent_audit_id: string | null;
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
  parent_audit?: {
    id: string;
    audit_type: StockAuditType;
    description: string;
    reported_at: string;
  } | null;
  resolutions?: {
    id: string;
    description: string;
    reported_at: string;
    status: StockAuditStatus;
  }[];
}

export interface CreateStockAuditData {
  product_id: string;
  serial_number_id?: string | null;
  audit_type: StockAuditType;
  quantity: number;
  description: string;
  evidence_urls?: string[];
  status?: StockAuditStatus;
  parent_audit_id?: string | null;
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

      // First query: get audits with product and serial info
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

      if (error) {
        console.error('Error fetching stock audits:', error);
        throw error;
      }

      // Process the data to add parent_audit and resolutions info
      const auditsWithRelations = await Promise.all((data || []).map(async (audit) => {
        let parent_audit = null;
        let resolutions: any[] = [];

        // Fetch parent audit if exists
        if (audit.parent_audit_id) {
          const { data: parentData } = await supabase
            .from('stock_audits')
            .select('id, audit_type, description, reported_at')
            .eq('id', audit.parent_audit_id)
            .maybeSingle();
          parent_audit = parentData;
        }

        // Fetch resolutions (child audits)
        const { data: resolutionsData } = await supabase
          .from('stock_audits')
          .select('id, description, reported_at, status')
          .eq('parent_audit_id', audit.id);
        resolutions = resolutionsData || [];

        return {
          ...audit,
          parent_audit,
          resolutions,
        };
      }));

      return auditsWithRelations as StockAudit[];
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
          parent_audit_id: data.parent_audit_id || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return audit;
    },
    onSuccess: async () => {
      // Force immediate refetch instead of just invalidating
      await queryClient.refetchQueries({ queryKey: ['stock-audits'] });
    },
    onError: (error: any) => {
      console.error('Erro ao registrar auditoria:', error);
      toast.error('Erro ao registrar auditoria: ' + (error?.message || 'Erro desconhecido'));
    },
  });
}
