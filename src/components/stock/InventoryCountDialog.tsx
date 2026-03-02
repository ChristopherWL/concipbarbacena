import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { useCreateStockAudit } from '@/hooks/useStockAudits';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUp, ArrowDown, Minus, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProductSearchSelect } from './ProductSearchSelect';

const inventorySchema = z.object({
  product_id: z.string().min(1, 'Selecione um produto'),
  real_quantity: z.coerce.number().min(0, 'Quantidade deve ser >= 0'),
  notes: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas as Categorias' },
  { value: 'materiais', label: 'Materiais' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'epi', label: 'EPI' },
  { value: 'epc', label: 'EPC' },
];

export function InventoryCountDialog({ open, onOpenChange }: InventoryCountDialogProps) {
  const { data: products = [] } = useProducts();
  const createAudit = useCreateStockAudit();
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = selectedCategory && selectedCategory !== 'all'
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      product_id: '',
      real_quantity: 0,
      notes: '',
    },
  });

  const realQuantity = form.watch('real_quantity');
  const watchProductId = form.watch('product_id');
  const systemQuantity = selectedProduct?.current_stock ?? 0;
  const difference = realQuantity - systemQuantity;

  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedProduct(null);
      setSelectedCategory('all');
    }
  }, [open, form]);

  const onSubmit = async () => {
    const data = form.getValues();
    if (!selectedProduct) {
      toast.error('Selecione um produto');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createAudit.mutateAsync({
        product_id: data.product_id,
        audit_type: 'inventario',
        quantity: Math.max(1, Math.abs(difference)),
        description: `Inventário: Sistema ${systemQuantity} → Real ${data.real_quantity} (${difference >= 0 ? '+' : ''}${difference})${data.notes ? `. ${data.notes}` : ''}`,
        status: 'resolvido',
      });

      if (difference !== 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ current_stock: data.real_quantity })
          .eq('id', data.product_id);

        if (updateError) throw updateError;
      }

      toast.success('Inventário registrado com sucesso');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao registrar inventário: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    setSelectedProduct(product || null);
    form.setValue('product_id', productId);
    if (product) {
      form.setValue('real_quantity', product.current_stock);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    form.setValue('product_id', '');
    setSelectedProduct(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Contagem de Inventário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label>
              Produto *
              {selectedCategory && (
                <span className="text-muted-foreground ml-1">({filteredProducts.length} itens)</span>
              )}
            </Label>
            <ProductSearchSelect
              products={filteredProducts}
              value={watchProductId}
              onChange={handleProductChange}
              placeholder="Pesquisar produto..."
              showStock
            />
          </div>

          {/* Product Info & Count */}
          {selectedProduct && (
            <div className="p-4 border border-border rounded-lg space-y-4 bg-muted/30">
              <div className="text-center pb-3 border-b border-border/50">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">{selectedProduct.code}</p>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Quantidade no Sistema</span>
                <span className="text-xl font-bold text-primary">{systemQuantity}</span>
              </div>

              <div className="space-y-2">
                <Label>Quantidade Real *</Label>
                <Input
                  type="number"
                  min={0}
                  value={realQuantity}
                  onChange={(e) => form.setValue('real_quantity', Number(e.target.value))}
                  className="h-12 text-center text-xl font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-sm font-medium">Diferença</span>
                <div className="flex items-center gap-2">
                  {difference > 0 && (
                    <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white gap-1 px-3 py-1">
                      <ArrowUp className="w-4 h-4" />
                      +{difference}
                    </Badge>
                  )}
                  {difference < 0 && (
                    <Badge variant="destructive" className="gap-1 px-3 py-1">
                      <ArrowDown className="w-4 h-4" />
                      {difference}
                    </Badge>
                  )}
                  {difference === 0 && (
                    <Badge variant="outline" className="gap-1 px-3 py-1 text-muted-foreground">
                      <Minus className="w-4 h-4" />
                      0
                    </Badge>
                  )}
                </div>
              </div>

              {difference !== 0 && (
                <p className="text-sm text-muted-foreground italic text-center">
                  {difference > 0 
                    ? 'O estoque será ajustado para cima.'
                    : 'O estoque será ajustado para baixo.'}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Motivo da diferença ou observações..."
              value={form.watch('notes') || ''}
              onChange={(e) => form.setValue('notes', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting || !selectedProduct}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Salvar Contagem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
