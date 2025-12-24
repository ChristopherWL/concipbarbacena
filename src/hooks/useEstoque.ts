import { useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useStockAudits } from '@/hooks/useStockAudits';
import { StockCategory } from '@/types/stock';

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

export interface UseEstoqueReturn {
  // Data
  products: ReturnType<typeof useProducts>['data'];
  audits: ReturnType<typeof useStockAudits>['data'];
  
  // Loading states
  isLoading: boolean;
  productsLoading: boolean;
  auditsLoading: boolean;
  
  // Computed stats
  getCategoryStats: (category: StockCategory) => CategoryStats;
  auditStats: AuditStats;
  
  // Summary
  totalProducts: number;
  totalStock: number;
  totalLowStock: number;
}

// ============= HOOK =============

export function useEstoque(): UseEstoqueReturn {
  const { 
    data: products = [], 
    isLoading: productsLoading 
  } = useProducts();
  
  const { 
    data: audits = [], 
    isLoading: auditsLoading 
  } = useStockAudits();

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

  // Memoized audit stats
  const auditStats = useMemo<AuditStats>(() => {
    const pending = audits.filter(a => a.status === 'aberto' || a.status === 'em_analise').length;
    return { 
      total: audits.length, 
      pending 
    };
  }, [audits]);

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
    
    // Computed stats
    getCategoryStats,
    auditStats,
    
    // Summary
    ...summaryStats,
  };
}
