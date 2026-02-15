import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ServiceProviderManualPayment {
  id: string;
  tenant_id: string;
  service_provider_id: string;
  reference_month: number;
  reference_year: number;
  total_os_count: number;
  total_days_worked: number;
  total_hours_worked: number;
  total_amount: number;
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
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['sp-manual-payments', tenantId, providerId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      let query = supabase
        .from('service_provider_payments')
        .select(`
          *,
          service_provider:service_providers(id, name, specialty, payment_type, daily_rate, hourly_rate)
        `)
        .eq('tenant_id', tenantId)
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false });

      if (providerId) {
        query = query.eq('service_provider_id', providerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payment: {
      service_provider_id: string;
      reference_month: number;
      reference_year: number;
      total_days_worked?: number;
      total_hours_worked?: number;
      total_amount: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('service_provider_payments')
        .insert([{ 
          service_provider_id: payment.service_provider_id,
          reference_month: payment.reference_month,
          reference_year: payment.reference_year,
          total_days_worked: payment.total_days_worked ?? 0,
          total_hours_worked: payment.total_hours_worked ?? 0,
          total_os_count: 0,
          total_amount: payment.total_amount,
          notes: payment.notes,
          tenant_id: tenantId!,
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
