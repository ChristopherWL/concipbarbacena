import { useState } from 'react';
import { Product, CATEGORY_LABELS, StockCategory } from '@/types/stock';
import { useDeleteProduct } from '@/hooks/useProducts';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { ProductFormDialog } from './ProductFormDialog';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, Barcode, Package } from 'lucide-react';

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const { isAdmin } = useAuthContext();
  const { isReadOnly } = useUserPermissions();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const deleteProductMutation = useDeleteProduct();
  const { data: serialNumbers = [] } = useSerialNumbers();

  const handleDelete = () => {
    if (deleteProduct) {
      deleteProductMutation.mutate(deleteProduct.id);
      setDeleteProduct(null);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.current_stock === 0) {
      return { label: 'Sem estoque', variant: 'destructive' as const };
    }
    if (product.current_stock <= product.min_stock) {
      return { label: 'Estoque baixo', variant: 'warning' as const };
    }
    return { label: 'Normal', variant: 'success' as const };
  };

  const getProductSerialCounts = (productId: string) => {
    const productSerials = serialNumbers.filter(s => s.product_id === productId);
    return {
      total: productSerials.length,
      disponivel: productSerials.filter(s => s.status === 'disponivel').length,
      em_uso: productSerials.filter(s => s.status === 'em_uso').length,
    };
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum produto encontrado</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Cadastre seu primeiro produto para começar a gerenciar seu estoque
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View - Cards */}
      <div className="sm:hidden space-y-3 p-3">
        {products.map((product) => {
          const stockStatus = getStockStatus(product);
          const serialCounts = product.is_serialized ? getProductSerialCounts(product.id) : null;
          return (
            <div 
              key={product.id}
              className="bg-card border rounded-lg p-3 cursor-pointer active:bg-muted/50 transition-colors"
              onClick={() => setDetailsProduct(product)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{product.name}</span>
                      {product.is_serialized && (
                        <Barcode className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{product.code}</span>
                  </div>
                </div>
                {!isReadOnly && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditProduct(product); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {isAdmin() && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); setDeleteProduct(product); }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="font-semibold text-lg block">{product.current_stock}</span>
                    <span className="text-[10px] text-muted-foreground">{product.unit}</span>
                  </div>
                  {serialCounts && (
                    <div className="text-center border-l pl-3">
                      <span className="font-semibold block">{serialCounts.disponivel}</span>
                      <span className="text-[10px] text-muted-foreground">disp.</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">R$ {product.cost_price.toFixed(2)}</span>
                  <Badge 
                    variant={stockStatus.variant === 'success' ? 'default' : stockStatus.variant === 'warning' ? 'secondary' : 'destructive'}
                    className={`text-xs ${stockStatus.variant === 'success' ? 'bg-success text-success-foreground' : stockStatus.variant === 'warning' ? 'bg-warning text-warning-foreground' : ''}`}
                  >
                    {stockStatus.label}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold text-center hidden lg:table-cell">Código</TableHead>
              <TableHead className="font-semibold">Produto</TableHead>
              <TableHead className="font-semibold text-center w-20">Qtd</TableHead>
              <TableHead className="font-semibold text-center hidden xl:table-cell">Categoria</TableHead>
              <TableHead className="font-semibold text-center hidden lg:table-cell">Status</TableHead>
              <TableHead className="font-semibold text-center hidden xl:table-cell">Custo</TableHead>
              {!isReadOnly && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <TableRow 
                  key={product.id} 
                  className="cursor-pointer transition-colors hover:bg-muted/50 group"
                  onClick={() => setDetailsProduct(product)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground text-center hidden lg:table-cell">{product.code}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-foreground truncate">{product.name}</span>
                          {product.is_serialized && (
                            <Barcode className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono lg:hidden">{product.code}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-base">{product.current_stock}</span>
                      <span className="text-[10px] text-muted-foreground">{product.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center hidden xl:table-cell">
                    <Badge variant="outline" className="font-normal text-xs">{CATEGORY_LABELS[product.category as StockCategory]}</Badge>
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    <Badge 
                      variant={stockStatus.variant === 'success' ? 'default' : stockStatus.variant === 'warning' ? 'secondary' : 'destructive'}
                      className={`text-xs ${stockStatus.variant === 'success' ? 'bg-success text-success-foreground' : stockStatus.variant === 'warning' ? 'bg-warning text-warning-foreground' : ''}`}
                    >
                      {stockStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center hidden xl:table-cell">
                    <span className="font-mono text-sm">R$ {product.cost_price.toFixed(2)}</span>
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell onClick={(e) => e.stopPropagation()} className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => setEditProduct(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {isAdmin() && (
                            <DropdownMenuItem 
                              onClick={() => setDeleteProduct(product)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <ProductFormDialog
        open={!!editProduct}
        onOpenChange={(open) => !open && setEditProduct(null)}
        product={editProduct || undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto "{deleteProduct?.name}" será removido do sistema. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        product={detailsProduct}
        open={!!detailsProduct}
        onOpenChange={(open) => !open && setDetailsProduct(null)}
      />
    </>
  );
}
