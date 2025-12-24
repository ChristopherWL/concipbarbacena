import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProducts } from '@/hooks/useProducts';
import { useStockAudits } from '@/hooks/useStockAudits';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { supabase } from '@/integrations/supabase/client';
import { StockCategory } from '@/types/stock';
import { subDays, format, startOfDay } from 'date-fns';

// All stock categories
const CATEGORIES: StockCategory[] = ['epi', 'epc', 'ferramentas', 'materiais', 'equipamentos'];

// ============= TYPES =============

export interface CategoryStats {
  total: number;
  totalStock: number;
  lowStock: number;
}

export interface AuditStats {
  total: number;
  pending: number;
}

export interface MovementTrendPoint {
  date: string;
  entradas: number;
  saidas: number;
}

export interface CriticalAlert {
  id: string;
  name: string;
  code: string;
  category: StockCategory;
  currentStock: number;
  minStock: number;
}

// Pre-computed stats by category
export type StatsByCategory = Record<StockCategory, CategoryStats>;
export type TrendsByCategory = Record<StockCategory, MovementTrendPoint[]>;

export interface UseEstoqueReturn {
  // Data
  products: ReturnType<typeof useProducts>['data'];
  audits: ReturnType<typeof useStockAudits>['data'];
  
  // Loading states
  isLoading: boolean;
  productsLoading: boolean;
  auditsLoading: boolean;
  movementTrendLoading: boolean;
  
  // Pre-computed stats (no functions, just data)
  statsByCategory: StatsByCategory;
  trendsByCategory: TrendsByCategory;
  auditStats: AuditStats;
  
  // Critical alerts
  criticalAlerts: CriticalAlert[];
  zeroStockProducts: CriticalAlert[];
  
  // Summary
  totalProducts: number;
  totalStock: number;
  totalLowStock: number;
}

// ============= HOOK =============

export function useEstoque(): UseEstoqueReturn {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();
  
  const { 
    data: products = [], 
    isLoading: productsLoading 
  } = useProducts();
  
  const { 
    data: audits = [], 
    isLoading: auditsLoading 
  } = useStockAudits();

  // Fetch movement trends for last 7 days
  const { data: movementTrends = [], isLoading: movementTrendLoading } = useQuery({
    queryKey: ['stock_movement_trends', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const sevenDaysAgo = startOfDay(subDays(new Date(), 7)).toISOString();
      
      let query = supabase
        .from('stock_movements')
        .select(`
          id,
          movement_type,
          quantity,
          created_at,
          product:products!inner(category)
        `)
        .eq('tenant_id', tenant.id)
        .gte('created_at', sevenDaysAgo);
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Pre-compute all category stats in a single pass
  const statsByCategory = useMemo<StatsByCategory>(() => {
    const stats = {} as StatsByCategory;
    
    // Initialize all categories with zero values
    CATEGORIES.forEach(cat => {
      stats[cat] = { total: 0, totalStock: 0, lowStock: 0 };
    });
    
    // Single pass through products to calculate all stats
    products.forEach(p => {
      const cat = p.category as StockCategory;
      if (stats[cat]) {
        stats[cat].total += 1;
        stats[cat].totalStock += p.current_stock || 0;
        if ((p.current_stock || 0) <= (p.min_stock || 0)) {
          stats[cat].lowStock += 1;
        }
      }
    });
    
    return stats;
  }, [products]);

  // Pre-compute all movement trends by category
  const trendsByCategory = useMemo<TrendsByCategory>(() => {
    const trends = {} as TrendsByCategory;
    
    // Generate date range for last 7 days
    const dateRange: { dateStr: string; displayDate: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      dateRange.push({
        dateStr: format(date, 'yyyy-MM-dd'),
        displayDate: format(date, 'dd/MM'),
      });
    }
    
    // Initialize all categories with empty trends
    CATEGORIES.forEach(cat => {
      trends[cat] = dateRange.map(d => ({ 
        date: d.displayDate, 
        entradas: 0, 
        saidas: 0 
      }));
    });
    
    // Single pass through movements to aggregate by category and date
    movementTrends.forEach((m: any) => {
      const movementDate = format(new Date(m.created_at), 'yyyy-MM-dd');
      const category = m.product?.category as StockCategory;
      
      if (!category || !trends[category]) return;
      
      const dateIndex = dateRange.findIndex(d => d.dateStr === movementDate);
      if (dateIndex === -1) return;
      
      const quantity = m.quantity || 0;
      if (m.movement_type === 'entrada' || m.movement_type === 'devolucao') {
        trends[category][dateIndex].entradas += quantity;
      } else if (m.movement_type === 'saida') {
        trends[category][dateIndex].saidas += quantity;
      }
    });
    
    return trends;
  }, [movementTrends]);

  // Memoized audit stats
  const auditStats = useMemo<AuditStats>(() => {
    const pending = audits.filter(a => a.status === 'aberto' || a.status === 'em_analise').length;
    return { 
      total: audits.length, 
      pending 
    };
  }, [audits]);

  // Memoized critical alerts (zero stock or below minimum)
  const criticalAlerts = useMemo<CriticalAlert[]>(() => {
    return products
      .filter(p => (p.current_stock || 0) <= (p.min_stock || 0))
      .map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        category: p.category as StockCategory,
        currentStock: p.current_stock || 0,
        minStock: p.min_stock || 0,
      }))
      .slice(0, 10);
  }, [products]);

  // Memoized zero stock products
  const zeroStockProducts = useMemo<CriticalAlert[]>(() => {
    return products
      .filter(p => (p.current_stock || 0) === 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        category: p.category as StockCategory,
        currentStock: 0,
        minStock: p.min_stock || 0,
      }))
      .slice(0, 8);
  }, [products]);

  // Memoized summary stats - derive from statsByCategory
  const summaryStats = useMemo(() => {
    let totalProducts = 0;
    let totalStock = 0;
    let totalLowStock = 0;
    
    CATEGORIES.forEach(cat => {
      totalProducts += statsByCategory[cat].total;
      totalStock += statsByCategory[cat].totalStock;
      totalLowStock += statsByCategory[cat].lowStock;
    });
    
    return { totalProducts, totalStock, totalLowStock };
  }, [statsByCategory]);

  return {
    // Data
    products,
    audits,
    
    // Loading states
    isLoading: productsLoading || auditsLoading,
    productsLoading,
    auditsLoading,
    movementTrendLoading,
    
    // Pre-computed stats
    statsByCategory,
    trendsByCategory,
    auditStats,
    
    // Critical alerts
    criticalAlerts,
    zeroStockProducts,
    
    // Summary
    ...summaryStats,
  };
}
