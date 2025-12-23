import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  showAllOption?: boolean;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showAllOption = true,
  className,
}: TablePaginationProps) {
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize);
  const startItem = pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1;
  const endItem = pageSize === -1 ? totalItems : Math.min(currentPage * pageSize, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Exibindo</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            onPageSizeChange(Number(value));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
            {showAllOption && (
              <SelectItem value="-1">Todos</SelectItem>
            )}
          </SelectContent>
        </Select>
        <span>
          de {totalItems} {totalItems === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious || pageSize === -1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious || pageSize === -1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-medium">
            {pageSize === -1 ? '1 / 1' : `${currentPage} / ${totalPages || 1}`}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext || pageSize === -1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext || pageSize === -1}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Hook para facilitar o uso da paginação
export function usePagination<T>(items: T[], defaultPageSize: number = 10) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);

  const paginatedItems = React.useMemo(() => {
    if (pageSize === -1) return items;
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  // Reset to page 1 when items change significantly
  React.useEffect(() => {
    const maxPage = pageSize === -1 ? 1 : Math.ceil(items.length / pageSize);
    if (currentPage > maxPage) {
      setCurrentPage(Math.max(1, maxPage));
    }
  }, [items.length, pageSize, currentPage]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems: items.length,
  };
}
