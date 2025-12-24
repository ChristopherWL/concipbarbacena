import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStockAudits } from '@/hooks/useStockAudits';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { supabase } from '@/integrations/supabase/client';
import { StockCategory } from '@/types/stock';
import { subDays, format } from 'date-fns';

// All stock categories
const CATEGORIES: StockCategory[] = ['epi', 'epc', 'ferramentas', 'materiais', 'equipamentos'];

// ============= TYPES =============

export interface CategoryStats {
  total: number;
  totalStock: number;
  totalValue: number;
  lowStock: number;
  zeroStock: number;
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

export interface ZeroStockProduct {
  id: string;
  name: string;
  category: StockCategory;
  sku: string | null;
}

// Pre-computed stats by category
export type StatsByCategory = Record<StockCategory, CategoryStats>;
export type TrendsByCategory = Record<StockCategory, MovementTrendPoint[]>;

export interface UseEstoqueReturn {
  // Loading states
  isLoading: boolean;
  statsLoading: boolean;
  auditsLoading: boolean;
  trendsLoading: boolean;
  
  // Pre-computed stats from DB (no products array needed for dashboard)
  statsByCategory: StatsByCategory;
  trendsByCategory: TrendsByCategory;
  auditStats: AuditStats;
  
  // Critical alerts (minimal data from DB)
  zeroStockProducts: ZeroStockProduct[];
  
  // Summary totals
  totalProducts: number;
  totalStock: number;
  totalLowStock: number;
  totalValue: number;
}

// ============= HOOK =============

export function useEstoque(): UseEstoqueReturn {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();
  
  const effectiveBranchId = shouldFilter ? branchId : null;
  
  // Fetch aggregated category stats from RPC
  const { data: categoryStatsRaw = [], isLoading: statsLoading } = useQuery({
    queryKey: ['stock_category_stats', tenant?.id, effectiveBranchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase.rpc('get_stock_category_stats', {
        p_tenant_id: tenant.id,
        p_branch_id: effectiveBranchId,
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch zero stock products for alerts
  const { data: zeroStockRaw = [], isLoading: zeroStockLoading } = useQuery({
    queryKey: ['zero_stock_products', tenant?.id, effectiveBranchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase.rpc('get_zero_stock_products', {
        p_tenant_id: tenant.id,
        p_branch_id: effectiveBranchId,
        p_limit: 10,
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch movement trends from RPC
  const { data: trendsRaw = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['movement_trends', tenant?.id, effectiveBranchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase.rpc('get_movement_trends', {
        p_tenant_id: tenant.id,
        p_branch_id: effectiveBranchId,
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch audits for audit stats
  const { 
    data: audits = [], 
    isLoading: auditsLoading 
  } = useStockAudits();

  // Transform RPC results into statsByCategory
  const statsByCategory = useMemo<StatsByCategory>(() => {
    const stats = {} as StatsByCategory;
    
    // Initialize all categories with zero values
    CATEGORIES.forEach(cat => {
      stats[cat] = { total: 0, totalStock: 0, totalValue: 0, lowStock: 0, zeroStock: 0 };
    });
    
    // Map RPC results to stats
    categoryStatsRaw.forEach((row: any) => {
      const cat = row.category as StockCategory;
      if (stats[cat]) {
        stats[cat] = {
          total: Number(row.total_items) || 0,
          totalStock: Number(row.total_stock) || 0,
          totalValue: Number(row.total_value) || 0,
          lowStock: Number(row.low_stock_count) || 0,
          zeroStock: Number(row.zero_stock_count) || 0,
        };
      }
    });
    
    return stats;
  }, [categoryStatsRaw]);

  // Transform RPC trends into trendsByCategory
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
    
    // Map RPC results to trends
    trendsRaw.forEach((row: any) => {
      const category = row.category as StockCategory;
      if (!category || !trends[category]) return;
      
      const movementDateStr = row.movement_date; // Already a date string from DB
      const dateIndex = dateRange.findIndex(d => d.dateStr === movementDateStr);
      if (dateIndex === -1) return;
      
      trends[category][dateIndex].entradas += Number(row.total_in) || 0;
      trends[category][dateIndex].saidas += Number(row.total_out) || 0;
    });
    
    return trends;
  }, [trendsRaw]);

  // Transform zero stock products
  const zeroStockProducts = useMemo<ZeroStockProduct[]>(() => {
    return zeroStockRaw.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category as StockCategory,
      sku: row.sku,
    }));
  }, [zeroStockRaw]);

  // Memoized audit stats
  const auditStats = useMemo<AuditStats>(() => {
    const pending = audits.filter(a => a.status === 'aberto' || a.status === 'em_analise').length;
    return { 
      total: audits.length, 
      pending 
    };
  }, [audits]);

  // Summary stats derived from statsByCategory
  const summaryStats = useMemo(() => {
    let totalProducts = 0;
    let totalStock = 0;
    let totalLowStock = 0;
    let totalValue = 0;
    
    CATEGORIES.forEach(cat => {
      totalProducts += statsByCategory[cat].total;
      totalStock += statsByCategory[cat].totalStock;
      totalLowStock += statsByCategory[cat].lowStock;
      totalValue += statsByCategory[cat].totalValue;
    });
    
    return { totalProducts, totalStock, totalLowStock, totalValue };
  }, [statsByCategory]);

  return {
    // Loading states
    isLoading: statsLoading || auditsLoading || zeroStockLoading,
    statsLoading,
    auditsLoading,
    trendsLoading,
    
    // Pre-computed stats
    statsByCategory,
    trendsByCategory,
    auditStats,
    
    // Critical alerts
    zeroStockProducts,
    
    // Summary
    ...summaryStats,
  };
}
