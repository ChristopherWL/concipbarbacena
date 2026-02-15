import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatsCard, StatsGrid } from '@/components/layout/StatsCard';
import { EPIFormDialog } from '@/components/stock/EPIFormDialog';
import { EstoqueTable } from '@/components/stock/EstoqueTable';
import { DataCard } from '@/components/layout/DataCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductsPaginated } from '@/hooks/useProductsPaginated';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Plus, HardHat, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EstoqueEPI() {
  const { isReadOnly } = useUserPermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
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

  const handleOpenForm = useCallback(() => setIsFormOpen(true), []);
  const handleCloseForm = useCallback((open: boolean) => setIsFormOpen(open), []);

  // Stats
  const totalProducts = pagination.totalCount;
  const totalStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
  const lowStock = products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0) && p.min_stock).length;
  const inStock = products.filter(p => (p.current_stock || 0) > 0).length;

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="EPIs"
          description="Equipamentos de Proteção Individual"
          icon={<HardHat className="h-5 w-5" />}
        />

        {/* Stats Grid */}
        <StatsGrid columns={4}>
          <StatsCard
            value={totalProducts}
            label="Total de Produtos"
            icon={Package}
            variant="primary"
          />
          <StatsCard
            value={totalStock}
            label="Unidades em Estoque"
            icon={HardHat}
            variant="success"
          />
          <StatsCard
            value={inStock}
            label="Itens Disponíveis"
            icon={CheckCircle}
            variant="info"
          />
          <StatsCard
            value={lowStock}
            label="Estoque Baixo"
            icon={AlertTriangle}
            variant="destructive"
          />
        </StatsGrid>

        {/* Data Table */}
        <DataCard
          isLoading={isLoading}
          loadingColumns={8}
          loadingRows={5}
          header={{
            title: 'EPIs Cadastrados',
            count: { filtered: products.length, total: pagination.totalCount },
            searchValue: filters.search,
            onSearchChange: setSearch,
            searchPlaceholder: 'Buscar por código ou nome...',
            actions: (
              <Select value={filters.status || 'all'} onValueChange={setStatus}>
                <SelectTrigger className="w-28 bg-background h-8 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="in_stock">Em Estoque</SelectItem>
                  <SelectItem value="low_stock">Baixo Estoque</SelectItem>
                  <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>
            ),
            primaryAction: !isReadOnly ? {
              label: 'Novo EPI',
              mobileLabel: 'Novo',
              icon: Plus,
              onClick: handleOpenForm,
            } : undefined,
          }}
        >
          <EstoqueTable
            products={products}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={goToPage}
            onPageSizeChange={setPageSize}
            emptyMessage="Nenhum EPI encontrado"
          />
        </DataCard>

        <EPIFormDialog 
          open={isFormOpen} 
          onOpenChange={handleCloseForm}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
