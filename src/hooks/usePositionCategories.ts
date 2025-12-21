import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PositionCategory {
  id: string;
  tenant_id: string;
  name: string;
  is_driver: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePositionCategories() {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['position_categories', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase
        .from('position_categories')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as PositionCategory[];
    },
    enabled: !!tenant?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePositionCategory() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();

  return useMutation({
    mutationFn: async (category: { name: string; is_driver?: boolean }) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      
      const { data, error } = await supabase
        .from('position_categories')
        .insert({
          tenant_id: tenant.id,
          name: category.name,
          is_driver: category.is_driver || false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as PositionCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['position_categories'] });
      toast.success('Cargo cadastrado!');
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast.error('Este cargo já existe');
      } else {
        toast.error('Erro ao cadastrar cargo');
      }
    },
  });
}
