import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { toast } from "sonner";
import type { ServiceProvider, ServiceProviderAssignment, PaymentType } from "@/types/serviceProviders";

export function useServiceProviders() {
  const { tenant } = useAuth();
  const tenantId = tenant?.id;
  const { branchId } = useBranchFilter();
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['service-providers', tenantId, branchId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      let query = supabase
        .from('service_providers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceProvider[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (provider: Partial<ServiceProvider> & { name: string }) => {
      const { data, error } = await supabase
        .from('service_providers')
        .insert([{ ...provider, tenant_id: tenantId! }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Prestador cadastrado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceProvider> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Prestador atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_providers')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Prestador desativado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar: ${error.message}`);
    },
  });

  return {
    providers,
    isLoading,
    createProvider: createMutation.mutateAsync,
    updateProvider: updateMutation.mutateAsync,
    deleteProvider: deleteMutation.mutateAsync,
  };
}

export function useServiceProviderAssignments(providerId?: string) {
  const { tenant } = useAuth();
  const tenantId = tenant?.id;
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['sp-assignments', tenantId, providerId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      let query = supabase
        .from('service_provider_assignments')
        .select(`
          *,
          service_provider:service_providers(id, name, specialty),
          service_order:service_orders(id, order_number, title, status, customer:customers(name))
        `)
        .eq('tenant_id', tenantId)
        .order('assigned_at', { ascending: false });

      if (providerId) {
        query = query.eq('service_provider_id', providerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceProviderAssignment[];
    },
    enabled: !!tenantId,
  });

  const assignMutation = useMutation({
    mutationFn: async (assignment: {
      service_provider_id: string;
      service_order_id: string;
      payment_type: PaymentType;
      rate_applied: number;
      days_worked?: number;
      hours_worked?: number;
      notes?: string;
    }) => {
      // Calcula o valor total baseado no tipo de pagamento
      let total_amount = assignment.rate_applied;
      if (assignment.payment_type === 'diaria' && assignment.days_worked) {
        total_amount = assignment.rate_applied * assignment.days_worked;
      } else if (assignment.payment_type === 'hora' && assignment.hours_worked) {
        total_amount = assignment.rate_applied * assignment.hours_worked;
      }

      const { data, error } = await supabase
        .from('service_provider_assignments')
        .insert([{ 
          ...assignment, 
          tenant_id: tenantId,
          total_amount,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sp-assignments'] });
      toast.success('OS atribuída ao prestador');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atribuir OS: ${error.message}`);
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceProviderAssignment> & { id: string }) => {
      // Recalcula o valor total se necessário
      let total_amount = updates.rate_applied;
      if (updates.payment_type === 'diaria' && updates.days_worked && updates.rate_applied) {
        total_amount = updates.rate_applied * updates.days_worked;
      } else if (updates.payment_type === 'hora' && updates.hours_worked && updates.rate_applied) {
        total_amount = updates.rate_applied * updates.hours_worked;
      }

      const { data, error } = await supabase
        .from('service_provider_assignments')
        .update({ ...updates, total_amount })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sp-assignments'] });
      toast.success('Atribuição atualizada');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_provider_assignments')
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sp-assignments'] });
      toast.success('Pagamento registrado');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  return {
    assignments,
    isLoading,
    assignToOrder: assignMutation.mutateAsync,
    updateAssignment: updateAssignmentMutation.mutateAsync,
    markAsPaid: markAsPaidMutation.mutateAsync,
  };
}

export function useServiceProviderPaymentSummary(providerId: string, month: number, year: number) {
  const { tenant } = useAuth();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ['sp-payment-summary', providerId, month, year],
    queryFn: async () => {
      if (!tenantId || !providerId) return null;

      // Busca todas as atribuições do período
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      const { data: assignments, error } = await supabase
        .from('service_provider_assignments')
        .select('*')
        .eq('service_provider_id', providerId)
        .gte('assigned_at', startDate)
        .lte('assigned_at', endDate);

      if (error) throw error;

      const summary = {
        total_os_count: assignments?.length || 0,
        total_days_worked: assignments?.reduce((acc, a) => acc + (a.days_worked || 0), 0) || 0,
        total_hours_worked: assignments?.reduce((acc, a) => acc + (a.hours_worked || 0), 0) || 0,
        total_amount: assignments?.reduce((acc, a) => acc + (a.total_amount || 0), 0) || 0,
        paid_count: assignments?.filter(a => a.is_paid).length || 0,
        pending_amount: assignments?.filter(a => !a.is_paid).reduce((acc, a) => acc + (a.total_amount || 0), 0) || 0,
      };

      return summary;
    },
    enabled: !!tenantId && !!providerId,
  });
}
