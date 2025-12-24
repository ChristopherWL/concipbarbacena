import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductsTable } from '@/components/stock/ProductsTable';
import { EPCFormDialog } from '@/components/stock/EPCFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useProducts } from '@/hooks/useProducts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Plus } from 'lucide-react';

export default function EstoqueEPC() {
  const { isReadOnly } = useUserPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useProducts('epc');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader
          title="EPCs"
          description="Equipamentos de Proteção Coletiva"
        />

        {/* Main Content Card */}
        <Card className="overflow-hidden bg-transparent sm:bg-card border-0 sm:border shadow-none sm:shadow-[var(--shadow-card)]">
          <CardHeader className="border-b bg-muted/30 py-3 px-3 sm:px-6">
            {/* Mobile Layout */}
            <div className="sm:hidden space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">EPCs</CardTitle>
                  <CardDescription className="text-xs">{filteredProducts.length} de {products.length}</CardDescription>
                </div>
                {!isReadOnly && (
                  <Button onClick={() => setIsFormOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
                )}
              </div>
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">EPCs Cadastrados</CardTitle>
                <CardDescription>{filteredProducts.length} de {products.length} itens</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar por código ou nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                {!isReadOnly && (
                  <Button onClick={() => setIsFormOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo EPC
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-0 bg-transparent sm:bg-card">
            {productsLoading ? (
              <TableSkeleton columns={8} rows={5} />
            ) : (
              <ProductsTable products={filteredProducts} />
            )}
          </CardContent>
        </Card>

        <EPCFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
        />
      </div>
    </DashboardLayout>
  );
}
