import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Supplier, SupplierCategory } from '@/types/stock';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSuppliers(category?: SupplierCategory) {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['suppliers', tenant?.id, category],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('name');
      
      console.log('[useSuppliers] tenant_id:', tenant.id, 'category:', category, 'data:', data, 'error:', error);
      
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!tenant?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
