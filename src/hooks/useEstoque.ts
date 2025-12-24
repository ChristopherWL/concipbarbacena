import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProducts } from '@/hooks/useProducts';
import { useStockAudits } from '@/hooks/useStockAudits';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { supabase } from '@/integrations/supabase/client';
import { StockCategory, CATEGORY_LABELS } from '@/types/stock';
import { subDays, format, startOfDay } from 'date-fns';

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

export interface UseEstoqueReturn {
  // Data
  products: ReturnType<typeof useProducts>['data'];
  audits: ReturnType<typeof useStockAudits>['data'];
  
  // Loading states
  isLoading: boolean;
  productsLoading: boolean;
  auditsLoading: boolean;
  movementTrendLoading: boolean;
  
  // Computed stats
  getCategoryStats: (category: StockCategory) => CategoryStats;
  auditStats: AuditStats;
  
  // Movement trends (last 7 days)
  getMovementTrend: (category: StockCategory) => MovementTrendPoint[];
  
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
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoized category stats calculator
  const getCategoryStats = useMemo(() => {
    return (category: StockCategory): CategoryStats => {
      const categoryProducts = products.filter(p => p.category === category);
      return {
        total: categoryProducts.length,
        totalStock: categoryProducts.reduce((acc, p) => acc + (p.current_stock || 0), 0),
        lowStock: categoryProducts.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length,
      };
    };
  }, [products]);

  // Memoized movement trend by category
  const getMovementTrend = useMemo(() => {
    return (category: StockCategory): MovementTrendPoint[] => {
      const last7Days: MovementTrendPoint[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'dd/MM');
        
        const dayMovements = movementTrends.filter((m: any) => {
          const movementDate = format(new Date(m.created_at), 'yyyy-MM-dd');
          const movementCategory = m.product?.category;
          return movementDate === dateStr && movementCategory === category;
        });
        
        const entradas = dayMovements
          .filter((m: any) => m.movement_type === 'entrada' || m.movement_type === 'devolucao')
          .reduce((acc: number, m: any) => acc + (m.quantity || 0), 0);
          
        const saidas = dayMovements
          .filter((m: any) => m.movement_type === 'saida')
          .reduce((acc: number, m: any) => acc + (m.quantity || 0), 0);
        
        last7Days.push({ date: displayDate, entradas, saidas });
      }
      
      return last7Days;
    };
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
      .slice(0, 10); // Limit to 10 alerts
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
      .slice(0, 8); // Limit to 8 products
  }, [products]);

  // Memoized summary stats
  const summaryStats = useMemo(() => {
    return {
      totalProducts: products.length,
      totalStock: products.reduce((acc, p) => acc + (p.current_stock || 0), 0),
      totalLowStock: products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length,
    };
  }, [products]);

  return {
    // Data
    products,
    audits,
    
    // Loading states
    isLoading: productsLoading || auditsLoading,
    productsLoading,
    auditsLoading,
    movementTrendLoading,
    
    // Computed stats
    getCategoryStats,
    auditStats,
    
    // Movement trends
    getMovementTrend,
    
    // Critical alerts
    criticalAlerts,
    zeroStockProducts,
    
    // Summary
    ...summaryStats,
  };
}
