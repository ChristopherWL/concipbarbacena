import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { X, ArrowUp, ArrowDown, Minus, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { MobileFormWizard, WizardStep } from '@/components/ui/mobile-form-wizard';
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
      // Create audit record
      await createAudit.mutateAsync({
        product_id: data.product_id,
        audit_type: 'inventario',
        quantity: Math.max(1, Math.abs(difference)),
        description: `Inventário: Sistema ${systemQuantity} → Real ${data.real_quantity} (${difference >= 0 ? '+' : ''}${difference})${data.notes ? `. ${data.notes}` : ''}`,
        status: 'resolvido',
      });

      // Update product stock to match real quantity
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

  if (!open) return null;

  // Step 1: Category and Product Selection
  const step1Content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base">Categoria</Label>
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="h-12">
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

      <div className="space-y-2">
        <Label className="text-base">
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

      {selectedProduct && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="font-medium">{selectedProduct.name}</p>
          <p className="text-sm text-muted-foreground">Código: {selectedProduct.code}</p>
          <p className="text-sm text-muted-foreground">
            Estoque atual: {selectedProduct.current_stock} {selectedProduct.unit}
          </p>
        </div>
      )}
    </div>
  );

  // Step 2: Quantity Count
  const step2Content = (
    <div className="space-y-4">
      {selectedProduct && (
        <div className="p-4 border border-border rounded-lg space-y-4 bg-background shadow-sm">
          <div className="text-center pb-3 border-b border-border/50">
            <p className="font-medium text-lg">{selectedProduct.name}</p>
            <p className="text-sm text-muted-foreground">{selectedProduct.code}</p>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Quantidade no Sistema</span>
            <span className="text-2xl font-bold text-primary">{systemQuantity}</span>
          </div>

          <div className="space-y-2">
            <Label className="text-base">Quantidade Real *</Label>
            <Input
              type="number"
              min={0}
              value={realQuantity}
              onChange={(e) => form.setValue('real_quantity', Number(e.target.value))}
              className="h-14 text-center text-2xl font-bold"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <span className="text-sm font-medium">Diferença</span>
            <div className="flex items-center gap-2">
              {difference > 0 && (
                <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white gap-1 px-3 py-1 text-base">
                  <ArrowUp className="w-4 h-4" />
                  +{difference}
                </Badge>
              )}
              {difference < 0 && (
                <Badge variant="destructive" className="gap-1 px-3 py-1 text-base">
                  <ArrowDown className="w-4 h-4" />
                  {difference}
                </Badge>
              )}
              {difference === 0 && (
                <Badge variant="outline" className="gap-1 px-3 py-1 text-base text-muted-foreground">
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

      <div className="space-y-2">
        <Label className="text-base">Observações</Label>
        <Textarea
          placeholder="Motivo da diferença ou observações..."
          value={form.watch('notes') || ''}
          onChange={(e) => form.setValue('notes', e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>
    </div>
  );

  const wizardSteps: WizardStep[] = [
    { id: 'product', title: 'Produto', content: step1Content },
    { id: 'count', title: 'Contagem', content: step2Content },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between flex-shrink-0 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2 font-medium text-base flex-1 justify-center">
          <ClipboardList className="w-5 h-5" />
          Contagem de Inventário
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Wizard */}
      <MobileFormWizard
        steps={wizardSteps}
        onComplete={onSubmit}
        onCancel={() => onOpenChange(false)}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Contagem"
        className="flex-1 min-h-0"
      />
    </div>,
    document.body
  );
}
