import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Customer, ServiceOrder } from '@/types/serviceOrders';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';

export function useCustomers() {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['customers', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name');
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          tenant_id: tenant.id,
          branch_id: (customer as any).branch_id ?? (shouldFilter ? branchId : null),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente cadastrado!');
    },
    onError: () => toast.error('Erro ao cadastrar cliente'),
  });
}

export function useServiceOrders() {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['service_orders', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          team:teams(*)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceOrder[];
    },
    enabled: !!tenant?.id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useServiceOrder(id: string) {
  return useQuery({
    queryKey: ['service_order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          team:teams(*),
          items:service_order_items(*, product:products(*)),
          technicians:service_order_technicians(*, technician:technicians(*))
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as ServiceOrder;
    },
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();
  const { tenant, user } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (order: Omit<ServiceOrder, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'order_number' | 'customer' | 'team' | 'items' | 'technicians'>) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      const { data, error } = await supabase
        .from('service_orders')
        .insert({
          ...order,
          tenant_id: tenant.id,
          branch_id: (order as any).branch_id ?? (shouldFilter ? branchId : null),
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      toast.success('Ordem de serviço criada!');
    },
    onError: () => toast.error('Erro ao criar OS'),
  });
}

export function useUpdateServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ServiceOrder> & { id: string }) => {
      const { error } = await supabase.from('service_orders').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['service_order', vars.id] });
      toast.success('OS atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar OS'),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente removido!');
    },
    onError: () => toast.error('Erro ao remover cliente'),
  });
}

export function useDeleteServiceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_orders')
        .update({ status: 'cancelada' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      toast.success('Ordem de serviço cancelada!');
    },
    onError: () => toast.error('Erro ao cancelar OS'),
  });
}
