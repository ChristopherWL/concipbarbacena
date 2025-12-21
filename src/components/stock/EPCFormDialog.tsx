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

const EPC_TYPES = {
  cone: 'Cone de Sinalização',
  fita_zebrada: 'Fita Zebrada',
  placa: 'Placa de Sinalização',
  extintor: 'Extintor de Incêndio',
  barreira: 'Barreira de Proteção',
  sinalizador: 'Sinalizador Luminoso',
  cavalete: 'Cavalete',
  kit_primeiros_socorros: 'Kit Primeiros Socorros',
  outros: 'Outros',
};

const epcSchema = z.object({
  code: z.string().min(1, 'Código obrigatório').max(50),
  name: z.string().min(2, 'Nome obrigatório').max(200),
  epc_type: z.string().min(1, 'Selecione o tipo'),
  min_stock: z.coerce.number().min(0),
  cost_price: z.coerce.number().min(0),
});

type EPCFormData = z.infer<typeof epcSchema>;

interface EPCFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function EPCFormDialog({ open, onOpenChange, product }: EPCFormDialogProps) {
  const isMobile = useIsMobile();
  const isEditing = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [imageUrl, setImageUrl] = useState<string>(product?.image_url || '');

  const form = useForm<EPCFormData>({
    resolver: zodResolver(epcSchema),
    defaultValues: {
      code: '',
      name: '',
      epc_type: '',
      min_stock: 2,
      cost_price: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        epc_type: (product as any).epc_type || '',
        min_stock: product.min_stock,
        cost_price: product.cost_price,
      });
      setImageUrl(product.image_url || '');
    } else {
      form.reset({
        code: '',
        name: '',
        epc_type: '',
        min_stock: 2,
        cost_price: 0,
      });
      setImageUrl('');
    }
  }, [product, form, open]);

  const handleSubmit = async (data: EPCFormData) => {
    const productData = {
      code: data.code,
      name: data.name,
      category: 'epc' as const,
      epc_type: data.epc_type,
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

  const formContent = (
    <div className="space-y-4">
      <ProductImageUpload 
        currentUrl={imageUrl} 
        onUploadComplete={setImageUrl} 
      />
      
      <div className="space-y-1">
        <Label htmlFor="code">Código *</Label>
        <Input id="code" placeholder="EPC001" {...form.register('code')} />
        {form.formState.errors.code && (
          <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="epc_type">Tipo *</Label>
        <Select
          value={form.watch('epc_type')}
          onValueChange={(value) => form.setValue('epc_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EPC_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.epc_type && (
          <p className="text-xs text-destructive">{form.formState.errors.epc_type.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" placeholder="Ex: Cone de Sinalização 75cm" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
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

  if (isMobile && open) {
    const steps: WizardStep[] = [
      {
        id: 'dados',
        title: isEditing ? 'Editar EPC' : 'Novo EPC',
        content: formContent,
      },
    ];

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
        <div className="bg-primary px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-foreground">
            {isEditing ? 'Editar EPC' : 'Novo EPC'}
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="text-primary-foreground">{isEditing ? 'Editar EPC' : 'Novo EPC'}</DialogTitle>
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
