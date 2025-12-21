import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductsTable } from '@/components/stock/ProductsTable';
import { MaterialFormDialog, MATERIAL_TYPES } from '@/components/stock/MaterialFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useProducts } from '@/hooks/useProducts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Plus } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';

export default function EstoqueMateriais() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const { isReadOnly } = useUserPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useProducts('materiais');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <PageLoading text="Carregando materiais" />;
  }

  if (!user) return null;

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = materialTypeFilter === 'todos' || 
      (product as any).material_type === materialTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Page Header */}
        <PageHeader
          title="Materiais"
          description="Materiais de consumo e insumos por categoria"
        />

        {/* Main Content Card */}
        <Card className="overflow-hidden bg-transparent sm:bg-card border-0 sm:border shadow-none sm:shadow-[var(--shadow-card)]" data-tour="products-table">
          <CardHeader className="border-b bg-muted/30 py-3 px-3 sm:px-6">
            {/* Mobile Layout */}
            <div className="sm:hidden space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Materiais</CardTitle>
                  <CardDescription className="text-xs">{filteredProducts.length} de {products.length}</CardDescription>
                </div>
                {!isReadOnly && (
                  <Button onClick={() => setIsFormOpen(true)} size="sm" data-tour="add-product-btn">
                    <Plus className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-9 text-sm"
                />
                <Select value={materialTypeFilter} onValueChange={setMaterialTypeFilter}>
                  <SelectTrigger className="w-28 bg-background h-9 text-sm">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {Object.entries(MATERIAL_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Materiais Cadastrados</CardTitle>
                <CardDescription>{filteredProducts.length} de {products.length} itens</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar por código ou nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
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
                {!isReadOnly && (
                  <Button onClick={() => setIsFormOpen(true)} size="sm" data-tour="add-product-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Material
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

        <MaterialFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
        />
      </div>
    </DashboardLayout>
  );
}
