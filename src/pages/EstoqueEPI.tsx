import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EPIFormDialog } from '@/components/stock/EPIFormDialog';
import { EstoqueStats } from '@/components/stock/EstoqueStats';
import { EstoqueFilters } from '@/components/stock/EstoqueFilters';
import { EstoqueTable } from '@/components/stock/EstoqueTable';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useProductsPaginated } from '@/hooks/useProductsPaginated';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export default function EstoqueEPI() {
  const { isReadOnly } = useUserPermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Use paginated hook with URL sync
  const {
    products,
    isLoading,
    isFetching,
    pagination,
    filters,
    setSearch,
    setStatus,
    goToPage,
    setPageSize,
    resetFilters,
  } = useProductsPaginated('epi');

  // Memoized callbacks to prevent unnecessary re-renders
  const handleOpenForm = useCallback(() => setIsFormOpen(true), []);
  const handleCloseForm = useCallback((open: boolean) => setIsFormOpen(open), []);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader
          title="EPIs"
          description="Equipamentos de Proteção Individual"
        />

        {/* Stats Cards */}
        <EstoqueStats 
          products={products} 
          isLoading={isLoading} 
        />

        {/* Main Content Card */}
        <Card folded className="overflow-hidden bg-transparent sm:bg-card border-0 sm:border shadow-none sm:shadow-[var(--shadow-card)]">
          <CardHeader className="border-b bg-muted/30 py-3 px-3 sm:px-6">
            <EstoqueFilters
              filters={filters}
              totalCount={pagination.totalCount}
              isFetching={isFetching}
              isReadOnly={isReadOnly}
              title="EPIs Cadastrados"
              titleMobile="EPIs"
              onSearchChange={setSearch}
              onStatusChange={setStatus}
              onResetFilters={resetFilters}
              onAddNew={handleOpenForm}
              addNewLabel="Novo EPI"
              addNewLabelMobile="Novo"
            />
          </CardHeader>
          
          <CardContent className="p-0 sm:p-0 bg-transparent sm:bg-card">
            <EstoqueTable
              products={products}
              isLoading={isLoading}
              pagination={pagination}
              onPageChange={goToPage}
              onPageSizeChange={setPageSize}
              emptyMessage="Nenhum EPI encontrado"
            />
          </CardContent>
        </Card>

        <EPIFormDialog 
          open={isFormOpen} 
          onOpenChange={handleCloseForm}
        />
      </div>
    </DashboardLayout>
  );
}
