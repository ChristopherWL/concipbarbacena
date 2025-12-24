import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductsTable } from '@/components/stock/ProductsTable';
import { EPIFormDialog } from '@/components/stock/EPIFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { TablePagination } from '@/components/ui/table-pagination';
import { useProductsPaginated } from '@/hooks/useProductsPaginated';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Plus, Search, X, Loader2 } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';

export default function EstoqueEPI() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
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

  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync local search with URL search on mount
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        setSearch(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, setSearch]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <PageLoading text="Carregando EPIs" />;
  }

  if (!user) return null;

  const hasActiveFilters = filters.search || filters.status !== 'all';

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader
          title="EPIs"
          description="Equipamentos de Proteção Individual"
        />

        <Card className="overflow-hidden bg-transparent sm:bg-card border-0 sm:border shadow-none sm:shadow-[var(--shadow-card)]">
          <CardHeader className="border-b bg-muted/30 py-3 px-3 sm:px-6">
            {/* Mobile Layout */}
            <div className="sm:hidden space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">EPIs</CardTitle>
                  <CardDescription className="text-xs">
                    {pagination.totalCount} itens
                    {isFetching && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}
                  </CardDescription>
                </div>
                {!isReadOnly && (
                  <Button onClick={() => setIsFormOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="h-9 text-sm pl-8"
                  />
                </div>
                <Select value={filters.status} onValueChange={setStatus}>
                  <SelectTrigger className="w-28 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="low_stock">Baixo estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full">
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">EPIs Cadastrados</CardTitle>
                <CardDescription>
                  {pagination.totalCount} itens encontrados
                  {isFetching && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código ou nome..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-64 pl-8"
                  />
                </div>
                <Select value={filters.status} onValueChange={setStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="low_stock">Baixo estoque</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
                {!isReadOnly && (
                  <Button onClick={() => setIsFormOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo EPI
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 sm:p-0 bg-transparent sm:bg-card">
            {isLoading ? (
              <TableSkeleton columns={8} rows={5} />
            ) : (
              <>
                <ProductsTable products={products} />
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="border-t p-4">
                    <TablePagination
                      currentPage={pagination.page}
                      totalItems={pagination.totalCount}
                      pageSize={pagination.pageSize}
                      onPageChange={goToPage}
                      onPageSizeChange={setPageSize}
                      pageSizeOptions={[10, 20, 50, 100]}
                      showAllOption={false}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <EPIFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
        />
      </div>
    </DashboardLayout>
  );
}
