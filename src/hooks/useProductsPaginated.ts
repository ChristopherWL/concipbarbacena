import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, StockCategory } from '@/types/stock';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from './useBranchFilter';

// ============= TYPES =============

export interface ProductFilters {
  search: string;
  status: 'all' | 'active' | 'low_stock';
  sortBy: 'name' | 'code' | 'current_stock' | 'created_at';
  sortOrder: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UseProductsPaginatedReturn {
  // Data
  products: Product[];
  
  // Loading & Error
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  
  // Pagination
  pagination: PaginationState;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  
  // Filters
  filters: ProductFilters;
  setSearch: (search: string) => void;
  setStatus: (status: ProductFilters['status']) => void;
  setSorting: (sortBy: ProductFilters['sortBy'], sortOrder: ProductFilters['sortOrder']) => void;
  resetFilters: () => void;
  
  // Refetch
  refetch: () => void;
}

// ============= CONSTANTS =============

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  status: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};

// ============= HOOK =============

export function useProductsPaginated(category?: StockCategory): UseProductsPaginatedReturn {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL
  const filters = useMemo<ProductFilters>(() => ({
    search: searchParams.get('search') || DEFAULT_FILTERS.search,
    status: (searchParams.get('status') as ProductFilters['status']) || DEFAULT_FILTERS.status,
    sortBy: (searchParams.get('sortBy') as ProductFilters['sortBy']) || DEFAULT_FILTERS.sortBy,
    sortOrder: (searchParams.get('sortOrder') as ProductFilters['sortOrder']) || DEFAULT_FILTERS.sortOrder,
  }), [searchParams]);

  // Read pagination from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10);

  // Update URL params helper
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === DEFAULT_FILTERS[key as keyof ProductFilters]?.toString()) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Query for paginated products with count
  const queryResult = useQuery({
    queryKey: ['products-paginated', tenant?.id, category, branchId, filters, page, pageSize],
    queryFn: async () => {
      if (!tenant?.id) return { data: [], count: 0 };

      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build query
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .range(from, to);

      // Apply category filter
      if (category) {
        query = query.eq('category', category);
      }

      // Apply branch filter
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      // Apply search filter (server-side)
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }

      // Apply status filter
      if (filters.status === 'low_stock') {
        query = query.lte('current_stock', supabase.rpc ? 0 : 0); // Will filter client-side for now
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      const { data, error, count } = await query;

      if (error) throw error;

      // Client-side filter for low_stock (since we can't compare columns in Supabase easily)
      let filteredData = data as Product[];
      if (filters.status === 'low_stock') {
        filteredData = filteredData.filter(p => (p.current_stock || 0) <= (p.min_stock || 0));
      }

      return { 
        data: filteredData, 
        count: filters.status === 'low_stock' ? filteredData.length : (count || 0)
      };
    },
    enabled: !!tenant?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const totalCount = queryResult.data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Pagination handlers
  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    updateParams({ page: validPage === 1 ? null : String(validPage) });
  }, [totalPages, updateParams]);

  const nextPage = useCallback(() => {
    if (page < totalPages) goToPage(page + 1);
  }, [page, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (page > 1) goToPage(page - 1);
  }, [page, goToPage]);

  const setPageSize = useCallback((size: number) => {
    updateParams({ 
      pageSize: size === DEFAULT_PAGE_SIZE ? null : String(size),
      page: null // Reset to first page
    });
  }, [updateParams]);

  // Filter handlers
  const setSearch = useCallback((search: string) => {
    updateParams({ search: search || null, page: null });
  }, [updateParams]);

  const setStatus = useCallback((status: ProductFilters['status']) => {
    updateParams({ status: status === 'all' ? null : status, page: null });
  }, [updateParams]);

  const setSorting = useCallback((sortBy: ProductFilters['sortBy'], sortOrder: ProductFilters['sortOrder']) => {
    updateParams({ 
      sortBy: sortBy === 'name' ? null : sortBy,
      sortOrder: sortOrder === 'asc' ? null : sortOrder,
    });
  }, [updateParams]);

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return {
    // Data
    products: queryResult.data?.data || [],
    
    // Loading & Error
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    error: queryResult.error as Error | null,
    
    // Pagination
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    
    // Filters
    filters,
    setSearch,
    setStatus,
    setSorting,
    resetFilters,
    
    // Refetch
    refetch: queryResult.refetch,
  };
}
