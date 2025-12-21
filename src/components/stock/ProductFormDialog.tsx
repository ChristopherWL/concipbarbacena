import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product, StockCategory, CATEGORY_LABELS } from '@/types/stock';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFormWizard, WizardStep } from '@/components/ui/mobile-form-wizard';

const productSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').max(50),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(200),
  description: z.string().max(500).optional(),
  category: z.enum(['epi', 'epc', 'ferramentas', 'materiais', 'equipamentos']),
  unit: z.string().min(1, 'Unidade é obrigatória').max(10),
  is_serialized: z.boolean(),
  min_stock: z.coerce.number().min(0),
  max_stock: z.coerce.number().min(0).optional(),
  cost_price: z.coerce.number().min(0),
  sale_price: z.coerce.number().min(0).optional(),
  location: z.string().max(100).optional(),
  barcode: z.string().max(50).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  defaultCategory?: StockCategory;
}

export function ProductFormDialog({ 
  open, 
  onOpenChange, 
  product,
  defaultCategory 
}: ProductFormDialogProps) {
  const isMobile = useIsMobile();
  const isEditing = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      category: defaultCategory || 'materiais',
      unit: 'UN',
      is_serialized: false,
      min_stock: 0,
      max_stock: undefined,
      cost_price: 0,
      sale_price: undefined,
      location: '',
      barcode: '',
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        description: product.description || '',
        category: product.category,
        unit: product.unit,
        is_serialized: product.is_serialized,
        min_stock: product.min_stock,
        max_stock: product.max_stock || undefined,
        cost_price: product.cost_price,
        sale_price: product.sale_price || undefined,
        location: product.location || '',
        barcode: product.barcode || '',
      });
    } else {
      form.reset({
        code: '',
        name: '',
        description: '',
        category: defaultCategory || 'materiais',
        unit: 'UN',
        is_serialized: false,
        min_stock: 0,
        max_stock: undefined,
        cost_price: 0,
        sale_price: undefined,
        location: '',
        barcode: '',
      });
    }
  }, [product, defaultCategory, form, open]);

  const handleSubmit = async (data: ProductFormData) => {
    if (isEditing) {
      await updateProduct.mutateAsync({ id: product.id, ...data });
    } else {
      await createProduct.mutateAsync({
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        unit: data.unit,
        is_serialized: data.is_serialized,
        min_stock: data.min_stock,
        max_stock: data.max_stock,
        cost_price: data.cost_price,
        sale_price: data.sale_price,
        location: data.location,
        barcode: data.barcode,
        is_active: true,
      });
    }
    onOpenChange(false);
  };

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  // Step 1: Basic info
  const step1Content = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código *</Label>
          <Input id="code" placeholder="PRD001" {...form.register('code')} />
          {form.formState.errors.code && (
            <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Select
            value={form.watch('category')}
            onValueChange={(value) => form.setValue('category', value as StockCategory)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome do Produto *</Label>
        <Input id="name" placeholder="Nome do produto" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descrição detalhada do produto"
          rows={3}
          {...form.register('description')}
        />
      </div>
    </div>
  );

  // Step 2: Stock and pricing
  const step2Content = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unidade *</Label>
          <Select
            value={form.watch('unit')}
            onValueChange={(value) => form.setValue('unit', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UN">UN (Unidade)</SelectItem>
              <SelectItem value="PC">PC (Peça)</SelectItem>
              <SelectItem value="CX">CX (Caixa)</SelectItem>
              <SelectItem value="KG">KG (Quilograma)</SelectItem>
              <SelectItem value="MT">MT (Metro)</SelectItem>
              <SelectItem value="LT">LT (Litro)</SelectItem>
              <SelectItem value="PAR">PAR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_stock">Estoque Mínimo</Label>
          <Input id="min_stock" type="number" min={0} {...form.register('min_stock')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_stock">Estoque Máximo</Label>
          <Input id="max_stock" type="number" min={0} {...form.register('max_stock')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_price">Preço de Custo</Label>
          <Input id="cost_price" type="number" step="0.01" min={0} {...form.register('cost_price')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sale_price">Preço de Venda</Label>
          <Input id="sale_price" type="number" step="0.01" min={0} {...form.register('sale_price')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Localização</Label>
          <Input id="location" placeholder="Ex: Prateleira A1" {...form.register('location')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">Código de Barras</Label>
        <Input id="barcode" placeholder="7891234567890" {...form.register('barcode')} />
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <Label htmlFor="is_serialized" className="font-medium">Controle por Número de Série</Label>
          <p className="text-sm text-muted-foreground">
            Ative para rastrear cada unidade individualmente
          </p>
        </div>
        <Switch
          id="is_serialized"
          checked={form.watch('is_serialized')}
          onCheckedChange={(checked) => form.setValue('is_serialized', checked)}
          disabled={isEditing}
        />
      </div>
    </div>
  );

  // Mobile wizard
  if (isMobile && open) {
    const steps: WizardStep[] = [
      {
        id: 'basico',
        title: 'Dados Básicos',
        content: step1Content,
      },
      {
        id: 'estoque',
        title: 'Estoque e Preços',
        content: step2Content,
      },
    ];

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
        <div className="bg-primary px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-foreground">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <MobileFormWizard
          steps={steps}
          onComplete={form.handleSubmit(handleSubmit)}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}
        />
      </div>,
      document.body
    );
  }

  // Desktop dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="text-primary-foreground">{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            {isEditing 
              ? 'Atualize as informações do produto' 
              : 'Preencha os dados para cadastrar um novo produto'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" placeholder="PRD001" {...form.register('code')} />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) => form.setValue('category', value as StockCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input id="name" placeholder="Nome do produto" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição detalhada do produto"
              rows={3}
              {...form.register('description')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select
                value={form.watch('unit')}
                onValueChange={(value) => form.setValue('unit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UN">UN (Unidade)</SelectItem>
                  <SelectItem value="PC">PC (Peça)</SelectItem>
                  <SelectItem value="CX">CX (Caixa)</SelectItem>
                  <SelectItem value="KG">KG (Quilograma)</SelectItem>
                  <SelectItem value="MT">MT (Metro)</SelectItem>
                  <SelectItem value="LT">LT (Litro)</SelectItem>
                  <SelectItem value="PAR">PAR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">Estoque Mínimo</Label>
              <Input id="min_stock" type="number" min={0} {...form.register('min_stock')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock">Estoque Máximo</Label>
              <Input id="max_stock" type="number" min={0} {...form.register('max_stock')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price">Preço de Custo</Label>
              <Input id="cost_price" type="number" step="0.01" min={0} {...form.register('cost_price')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_price">Preço de Venda</Label>
              <Input id="sale_price" type="number" step="0.01" min={0} {...form.register('sale_price')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input id="location" placeholder="Ex: Prateleira A1" {...form.register('location')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input id="barcode" placeholder="7891234567890" {...form.register('barcode')} />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="is_serialized" className="font-medium">Controle por Número de Série</Label>
              <p className="text-sm text-muted-foreground">
                Ative para rastrear cada unidade individualmente (ex: equipamentos, câmeras)
              </p>
            </div>
            <Switch
              id="is_serialized"
              checked={form.watch('is_serialized')}
              onCheckedChange={(checked) => form.setValue('is_serialized', checked)}
              disabled={isEditing}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
