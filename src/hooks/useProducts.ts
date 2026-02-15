import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, StockCategory } from '@/types/stock';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';

export function useProducts(category?: StockCategory) {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['products', tenant?.id, category, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name');
      
      if (category) {
        query = query.eq('category', category);
      }

      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: string) {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id && !!tenant?.id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (
      product: Omit<Product, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'current_stock'>
    ) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          tenant_id: tenant.id,
          // If the user is branch-scoped, default to their branch unless explicitly provided
          branch_id: (product as any).branch_id ?? (shouldFilter ? branchId : null),
          current_stock: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('Já existe um produto com este código');
      } else {
        toast.error('Erro ao cadastrar produto');
      }
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar produto');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover produto');
    },
  });
}
