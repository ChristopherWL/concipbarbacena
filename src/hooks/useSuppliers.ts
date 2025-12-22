import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Supplier } from '@/types/stock';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSuppliers() {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['suppliers', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name');
      
      console.log('[useSuppliers] tenant_id:', tenant.id, 'data:', data, 'error:', error);
      
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!tenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - suppliers don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();

  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');

      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplier,
          tenant_id: tenant.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor cadastrado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao cadastrar fornecedor');
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplier)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar fornecedor');
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor removido!');
    },
    onError: () => {
      toast.error('Erro ao remover fornecedor');
    },
  });
}
