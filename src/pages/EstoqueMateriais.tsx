import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatsCard, StatsGrid } from '@/components/layout/StatsCard';
import { DataCard } from '@/components/layout/DataCard';
import { ProductsTable } from '@/components/stock/ProductsTable';
import { MaterialFormDialog, MATERIAL_TYPES } from '@/components/stock/MaterialFormDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Plus, Boxes, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EstoqueMateriais() {
  const { isReadOnly } = useUserPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useProducts('materiais');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = materialTypeFilter === 'todos' || 
      (product as any).material_type === materialTypeFilter;
    return matchesSearch && matchesType;
  });

  // Stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
  const lowStock = products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0) && p.min_stock).length;
  const inStock = products.filter(p => (p.current_stock || 0) > 0).length;

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Materiais"
          description="Materiais de consumo e insumos por categoria"
          icon={<Boxes className="h-5 w-5" />}
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
            icon={Boxes}
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
          isLoading={productsLoading}
          loadingColumns={8}
          loadingRows={5}
          header={{
            title: 'Materiais Cadastrados',
            count: { filtered: filteredProducts.length, total: products.length },
            searchValue: searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: 'Buscar por código ou nome...',
            actions: (
              <Select value={materialTypeFilter} onValueChange={setMaterialTypeFilter}>
                <SelectTrigger className="w-36 bg-background h-8 text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {Object.entries(MATERIAL_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
            primaryAction: !isReadOnly ? {
              label: 'Novo Material',
              mobileLabel: 'Novo',
              icon: Plus,
              onClick: () => setIsFormOpen(true),
            } : undefined,
          }}
        >
          <ProductsTable products={filteredProducts} />
        </DataCard>

        <MaterialFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
