import React, { memo, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { ProductFilters } from '@/hooks/useProductsPaginated';

// ============= TYPES =============

export interface EstoqueFiltersProps {
  filters: ProductFilters;
  totalCount: number;
  isFetching?: boolean;
  isReadOnly?: boolean;
  title?: string;
  titleMobile?: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: ProductFilters['status']) => void;
  onResetFilters: () => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  addNewLabelMobile?: string;
}

// ============= COMPONENT =============

export const EstoqueFilters = memo(function EstoqueFilters({
  filters,
  totalCount,
  isFetching = false,
  isReadOnly = false,
  title = 'Produtos Cadastrados',
  titleMobile = 'Produtos',
  onSearchChange,
  onStatusChange,
  onResetFilters,
  onAddNew,
  addNewLabel = 'Novo Produto',
  addNewLabelMobile = 'Novo',
}: EstoqueFiltersProps) {
  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync local search with external search
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, onSearchChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  }, []);

  const hasActiveFilters = filters.search || filters.status !== 'all';

  return (
    <>
      {/* Mobile Layout */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">{titleMobile}</h3>
            <p className="text-xs text-muted-foreground">
              {totalCount} itens
              {isFetching && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}
            </p>
          </div>
          {!isReadOnly && onAddNew && (
            <Button onClick={onAddNew} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {addNewLabelMobile}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={localSearch}
              onChange={handleSearchChange}
              className="h-9 text-sm pl-8"
            />
          </div>
          <Select value={filters.status} onValueChange={onStatusChange}>
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
          <Button variant="ghost" size="sm" onClick={onResetFilters} className="w-full">
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {totalCount} itens encontrados
            {isFetching && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={localSearch}
              onChange={handleSearchChange}
              className="w-64 pl-8"
            />
          </div>
          <Select value={filters.status} onValueChange={onStatusChange}>
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
            <Button variant="ghost" size="sm" onClick={onResetFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
          {!isReadOnly && onAddNew && (
            <Button onClick={onAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {addNewLabel}
            </Button>
          )}
        </div>
      </div>
    </>
  );
});
