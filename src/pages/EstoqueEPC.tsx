import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatsCard, StatsGrid } from '@/components/layout/StatsCard';
import { DataCard } from '@/components/layout/DataCard';
import { ProductsTable } from '@/components/stock/ProductsTable';
import { EPCFormDialog } from '@/components/stock/EPCFormDialog';
import { useProducts } from '@/hooks/useProducts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Plus, Shield, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EstoqueEPC() {
  const { isReadOnly } = useUserPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useProducts('epc');

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
          title="EPCs"
          description="Equipamentos de Proteção Coletiva"
          icon={<Shield className="h-5 w-5" />}
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
            icon={Shield}
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
            title: 'EPCs Cadastrados',
            count: { filtered: filteredProducts.length, total: products.length },
            searchValue: searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: 'Buscar por código ou nome...',
            primaryAction: !isReadOnly ? {
              label: 'Novo EPC',
              mobileLabel: 'Novo',
              icon: Plus,
              onClick: () => setIsFormOpen(true),
            } : undefined,
          }}
        >
          <ProductsTable products={filteredProducts} />
        </DataCard>

        <EPCFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
