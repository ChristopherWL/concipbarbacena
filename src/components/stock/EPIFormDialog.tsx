import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product } from '@/types/stock';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ProductImageUpload } from './ProductImageUpload';

const EPI_TYPES = {
  capacete: 'Capacete',
  luva: 'Luvas',
  oculos: 'Óculos',
  protetor_auricular: 'Protetor Auricular',
  bota: 'Calçado',
  mascara: 'Máscara',
  cinto_seguranca: 'Cinto de Segurança',
  vestimenta: 'Vestimenta',
  outros: 'Outros',
};

const epiSchema = z.object({
  code: z.string().min(1, 'Código obrigatório').max(50),
  name: z.string().min(2, 'Nome obrigatório').max(200),
  epi_type: z.string().min(1, 'Selecione o tipo'),
  ca_number: z.string().optional(),
  min_stock: z.coerce.number().min(0),
  cost_price: z.coerce.number().min(0),
});

type EPIFormData = z.infer<typeof epiSchema>;

interface EPIFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function EPIFormDialog({ open, onOpenChange, product }: EPIFormDialogProps) {
  const isMobile = useIsMobile();
  const isEditing = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [imageUrl, setImageUrl] = useState<string>(product?.image_url || '');

  const form = useForm<EPIFormData>({
    resolver: zodResolver(epiSchema),
    defaultValues: {
      code: '',
      name: '',
      epi_type: '',
      ca_number: '',
      min_stock: 5,
      cost_price: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        epi_type: (product as any).epi_type || '',
        ca_number: (product as any).ca_number || '',
        min_stock: product.min_stock,
        cost_price: product.cost_price,
      });
      setImageUrl(product.image_url || '');
    } else {
      form.reset({
        code: '',
        name: '',
        epi_type: '',
        ca_number: '',
        min_stock: 5,
        cost_price: 0,
      });
      setImageUrl('');
    }
  }, [product, form, open]);

  const handleSubmit = async (data: EPIFormData) => {
    const productData = {
      code: data.code,
      name: data.name,
      category: 'epi' as const,
      epi_type: data.epi_type,
      ca_number: data.ca_number || null,
      unit: 'UN',
      min_stock: data.min_stock,
      cost_price: data.cost_price,
      image_url: imageUrl || null,
      is_serialized: false,
      is_active: true,
    };

    if (isEditing) {
      await updateProduct.mutateAsync({ id: product.id, ...productData });
    } else {
      await createProduct.mutateAsync(productData);
    }
    onOpenChange(false);
  };

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  // Mobile form content
  const formContent = (
    <div className="space-y-4">
      <ProductImageUpload 
        currentUrl={imageUrl} 
        onUploadComplete={setImageUrl} 
      />
      
      <div className="space-y-1">
        <Label htmlFor="code">Código *</Label>
        <Input id="code" placeholder="EPI001" {...form.register('code')} />
        {form.formState.errors.code && (
          <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="epi_type">Tipo *</Label>
        <Select
          value={form.watch('epi_type')}
          onValueChange={(value) => form.setValue('epi_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EPI_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.epi_type && (
          <p className="text-xs text-destructive">{form.formState.errors.epi_type.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" placeholder="Ex: Capacete de Segurança Classe B" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="ca_number">Número do CA (opcional)</Label>
        <Input id="ca_number" placeholder="Ex: 12345" {...form.register('ca_number')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="min_stock">Estoque Mínimo</Label>
          <Input id="min_stock" type="number" min={0} {...form.register('min_stock')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cost_price">Preço (R$)</Label>
          <Input id="cost_price" type="number" step="0.01" min={0} {...form.register('cost_price')} />
        </div>
      </div>
    </div>
  );

  // Mobile wizard
  if (isMobile && open) {
    const steps: WizardStep[] = [
      {
        id: 'dados',
        title: isEditing ? 'Editar EPI' : 'Novo EPI',
        content: formContent,
      },
    ];

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
        <div className="bg-primary px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-foreground">
            {isEditing ? 'Editar EPI' : 'Novo EPI'}
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
          submitLabel={isEditing ? 'Salvar' : 'Cadastrar'}
        />
      </div>,
      document.body
    );
  }

  // Desktop dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="text-primary-foreground">{isEditing ? 'Editar EPI' : 'Novo EPI'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {formContent}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isEditing ? 'Salvar' : 'Cadastrar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
