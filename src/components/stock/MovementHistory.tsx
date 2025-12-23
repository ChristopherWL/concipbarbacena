import { useStockMovements } from '@/hooks/useStockMovements';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ArrowUp, ArrowDown, RefreshCw, Settings, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MovementType, MOVEMENT_TYPE_LABELS } from '@/types/stock';
import { cn } from '@/lib/utils';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';

const movementIcons: Record<MovementType, React.ReactNode> = {
  entrada: <ArrowDown className="h-4 w-4 text-emerald-600" />,
  saida: <ArrowUp className="h-4 w-4 text-destructive" />,
  transferencia: <RefreshCw className="h-4 w-4 text-blue-600" />,
  ajuste: <Settings className="h-4 w-4 text-amber-600" />,
  devolucao: <RotateCcw className="h-4 w-4 text-purple-600" />,
};

const movementColors: Record<MovementType, string> = {
  entrada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  saida: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  transferencia: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ajuste: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  devolucao: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

interface MovementHistoryProps {
  limit?: number;
}

export function MovementHistory({ limit }: MovementHistoryProps) {
  const { data: movements = [], isLoading } = useStockMovements();

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems,
    totalItems,
  } = usePagination(movements, 10);

  // If limit is provided, use it to slice, otherwise use pagination
  const displayMovements = limit ? movements.slice(0, limit) : paginatedItems;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (movements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Nenhuma movimentação registrada.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile View - Cards */}
      <div className="sm:hidden space-y-3">
        {displayMovements.map((movement) => (
          <Card key={movement.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {movement.product?.name || 'Produto não encontrado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(movement.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <Badge 
                  variant="secondary"
                  className={cn("gap-1 text-xs shrink-0", movementColors[movement.movement_type])}
                >
                  {movementIcons[movement.movement_type]}
                  {MOVEMENT_TYPE_LABELS[movement.movement_type]}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {movement.previous_stock} → {movement.new_stock}
                </span>
                <span className={cn(
                  "font-semibold",
                  movement.movement_type === 'saida' ? 'text-destructive' : 'text-emerald-600'
                )}>
                  {movement.movement_type === 'saida' ? '-' : '+'}
                  {movement.quantity}
                </span>
              </div>
              {movement.reason && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {movement.reason}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {!limit && (
          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            className="px-4"
          />
        )}
      </div>

      {/* Desktop View - Table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(movement.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn("gap-1", movementColors[movement.movement_type])}
                      >
                        {movementIcons[movement.movement_type]}
                        {MOVEMENT_TYPE_LABELS[movement.movement_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {movement.product?.name || 'Produto não encontrado'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-semibold",
                        movement.movement_type === 'saida' ? 'text-destructive' : 'text-emerald-600'
                      )}>
                        {movement.movement_type === 'saida' ? '-' : '+'}
                        {movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {movement.previous_stock} → {movement.new_stock}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {movement.reason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!limit && (
            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              className="px-4"
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
