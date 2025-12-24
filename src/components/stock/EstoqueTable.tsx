import React, { memo } from 'react';
import { ProductsTable } from '@/components/stock/ProductsTable';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { TablePagination } from '@/components/ui/table-pagination';
import { Product } from '@/types/stock';
import { PaginationState } from '@/hooks/useProductsPaginated';

// ============= TYPES =============

export interface EstoqueTableProps {
  products: Product[];
  isLoading: boolean;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  emptyMessage?: string;
}

// ============= COMPONENT =============

export const EstoqueTable = memo(function EstoqueTable({
  products,
  isLoading,
  pagination,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'Nenhum produto encontrado',
}: EstoqueTableProps) {
  if (isLoading) {
    return <TableSkeleton columns={8} rows={5} />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <ProductsTable products={products} />
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="border-t p-4">
          <TablePagination
            currentPage={pagination.page}
            totalItems={pagination.totalCount}
            pageSize={pagination.pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 20, 50, 100]}
            showAllOption={false}
          />
        </div>
      )}
    </>
  );
});
