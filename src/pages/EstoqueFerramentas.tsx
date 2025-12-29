import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatsCard, StatsGrid } from '@/components/layout/StatsCard';
import { DataCard } from '@/components/layout/DataCard';
import { ProductsTable } from '@/components/stock/ProductsTable';
import { FerramentaFormDialog } from '@/components/stock/FerramentaFormDialog';
import { useProducts } from '@/hooks/useProducts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Plus, Wrench, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EstoqueFerramentas() {
  const { isReadOnly } = useUserPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useProducts('ferramentas');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
  const lowStock = products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0) && p.min_stock).length;
  const inStock = products.filter(p => (p.current_stock || 0) > 0).length;

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Ferramentas"
          description="Ferramentas manuais, elétricas e de medição"
          icon={<Wrench className="h-5 w-5" />}
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
            icon={Wrench}
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
            title: 'Ferramentas Cadastradas',
            count: { filtered: filteredProducts.length, total: products.length },
            searchValue: searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: 'Buscar por código ou nome...',
            primaryAction: !isReadOnly ? {
              label: 'Nova Ferramenta',
              mobileLabel: 'Nova',
              icon: Plus,
              onClick: () => setIsFormOpen(true),
            } : undefined,
          }}
        >
          <ProductsTable products={filteredProducts} />
        </DataCard>

        <FerramentaFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
