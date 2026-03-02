import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { StockCategory } from '@/types/stock';

const CATEGORY_PREFIXES: Record<string, string> = {
  materiais: 'MAT',
  equipamentos: 'EQP',
  ferramentas: 'FER',
  epi: 'EPI',
  epc: 'EPC',
};

export function useNextProductCode(category: string, enabled: boolean = true) {
  const { tenant } = useAuthContext();
  const prefix = CATEGORY_PREFIXES[category] || 'PRD';

  return useQuery({
    queryKey: ['next-product-code', tenant?.id, category],
    queryFn: async () => {
      if (!tenant?.id) return `${prefix}01`;

      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('category', category as any);

      if (error) throw error;

      const next = (count || 0) + 1;
      return `${prefix}${String(next).padStart(2, '0')}`;
    },
    enabled: !!tenant?.id && enabled,
    staleTime: 0,
  });
}
