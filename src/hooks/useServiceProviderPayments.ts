import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { toast } from "sonner";
import type { PaymentType } from "@/types/serviceProviders";

export interface ServiceProviderManualPayment {
  id: string;
  tenant_id: string;
  branch_id?: string;
  service_provider_id: string;
  period_start: string;
  period_end: string;
  payment_type: string;
  days_worked: number;
  hours_worked: number;
  rate_applied: number;
  total_amount: number;
  description?: string;
  notes?: string;
  status: string;
  paid_at?: string;
  paid_by?: string;
  created_at: string;
  updated_at: string;
}

export function useServiceProviderPayments(providerId?: string) {
  const { tenant } = useAuth();
  const tenantId = tenant?.id;
  const { branchId } = useBranchFilter();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['sp-manual-payments', tenantId, providerId, branchId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      let query = supabase
        .from('service_provider_payments')
        .select(`
          *,
          service_provider:service_providers(id, name, specialty, payment_type, daily_rate, hourly_rate)
        `)
        .eq('tenant_id', tenantId)
        .order('period_start', { ascending: false });

      if (providerId) {
        query = query.eq('service_provider_id', providerId);
      }

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (ServiceProviderManualPayment & { service_provider?: { id: string; name: string; specialty?: string; payment_type: PaymentType; daily_rate?: number; hourly_rate?: number } })[];
    },
    enabled: !!tenantId,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payment: {
      service_provider_id: string;
      period_start: string;
      period_end: string;
      payment_type: string;
      days_worked?: number;
      hours_worked?: number;
      rate_applied: number;
      description?: string;
      notes?: string;
    }) => {
      // Calcula o valor total
      let total_amount = payment.rate_applied;
      if (payment.payment_type === 'diaria' && payment.days_worked) {
        total_amount = payment.rate_applied * payment.days_worked;
      } else if (payment.payment_type === 'hora' && payment.hours_worked) {
        total_amount = payment.rate_applied * payment.hours_worked;
      }

      const { data, error } = await supabase
        .from('service_provider_payments')
        .insert([{ 
          ...payment, 
          tenant_id: tenantId!,
          branch_id: branchId,
          total_amount,
          status: 'pendente',
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sp-manual-payments'] });
      toast.success('Pagamento registrado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar: ${error.message}`);
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_provider_payments')
        .update({ 
          status: 'pago', 
          paid_at: new Date().toISOString() 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sp-manual-payments'] });
      toast.success('Pagamento confirmado');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_provider_payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sp-manual-payments'] });
      toast.success('Pagamento excluído');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  return {
    payments,
    isLoading,
    createPayment: createPaymentMutation.mutateAsync,
    markAsPaid: markAsPaidMutation.mutateAsync,
    deletePayment: deletePaymentMutation.mutateAsync,
  };
}
