import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { X, AlertTriangle, Shield, Package, Search, Camera } from 'lucide-react';
import { useCreateStockAudit } from '@/hooks/useStockAudits';
import { useProducts } from '@/hooks/useProducts';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { toast } from 'sonner';
import { MobileFormWizard, WizardStep } from '@/components/ui/mobile-form-wizard';
import { ProductSearchSelect } from './ProductSearchSelect';
import { ScannerDialog } from './ScannerDialog';

const auditSchema = z.object({
  product_id: z.string().min(1, 'Selecione um produto'),
  serial_number_id: z.string().optional(),
  audit_type: z.enum(['defeito', 'furto', 'garantia']),
  quantity: z.number().min(1, 'Quantidade mínima é 1'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
});

type AuditFormData = z.infer<typeof auditSchema>;

interface StockAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProductId?: string;
}

const AUDIT_TYPE_LABELS: Record<'defeito' | 'furto' | 'garantia', { label: string; icon: React.ReactNode; color: string }> = {
  defeito: { label: 'Defeito', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-yellow-500' },
  furto: { label: 'Furto', icon: <Shield className="w-5 h-5" />, color: 'text-red-500' },
  garantia: { label: 'Garantia', icon: <Package className="w-5 h-5" />, color: 'text-blue-500' },
};

export function StockAuditDialog({ open, onOpenChange, defaultProductId }: StockAuditDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [serialSearch, setSerialSearch] = useState('');
  const [selectedSerialId, setSelectedSerialId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  
  const { data: products } = useProducts();
  const { data: serialNumbers } = useSerialNumbers(selectedProductId || undefined);
  const createAudit = useCreateStockAudit();

  const {
    register,
    setValue,
    watch,
    reset,
  } = useForm<AuditFormData>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      product_id: defaultProductId || '',
      audit_type: 'defeito',
      quantity: 1,
      description: '',
    },
  });

  const watchProductId = watch('product_id');
  const watchAuditType = watch('audit_type');
  const selectedProduct = products?.find(p => p.id === watchProductId);
  
  const filteredSerials = serialNumbers?.filter(s => 
    s.serial_number.toLowerCase().includes(serialSearch.toLowerCase())
  ) || [];

  useEffect(() => {
    setSelectedProductId(watchProductId);
  }, [watchProductId]);

  useEffect(() => {
    if (open && defaultProductId) {
      setValue('product_id', defaultProductId);
    }
  }, [open, defaultProductId, setValue]);

  useEffect(() => {
    if (!open) {
      setSerialSearch('');
      setSelectedSerialId(null);
      reset();
    }
  }, [open, reset]);

  const handleScan = useCallback((scannedValue: string) => {
    const matchedSerial = serialNumbers?.find(
      s => s.serial_number.toLowerCase() === scannedValue.toLowerCase()
    );
    if (matchedSerial) {
      setSelectedSerialId(matchedSerial.id);
      setValue('serial_number_id', matchedSerial.id);
      toast.success(`Serial ${scannedValue} encontrado!`);
    } else {
      toast.error(`Serial ${scannedValue} não encontrado`);
    }
  }, [serialNumbers, setValue]);

  const onSubmit = async () => {
    const data = watch();
    if (!data.product_id) {
      toast.error('Selecione um produto');
      return;
    }
    if (data.description.length < 10) {
      toast.error('Descrição deve ter pelo menos 10 caracteres');
      return;
    }
    
    try {
      await createAudit.mutateAsync({
        product_id: data.product_id,
        serial_number_id: selectedSerialId || null,
        audit_type: data.audit_type,
        quantity: data.quantity,
        description: data.description,
      });
      toast.success('Ocorrência registrada com sucesso');
      reset();
      setSelectedSerialId(null);
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido';
      console.error('Erro ao registrar ocorrência:', error);
      toast.error(`Erro ao registrar: ${errorMessage}`);
    }
  };

  if (!open) return null;

  // Step 1: Product Selection
  const step1Content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base">Produto *</Label>
        <ProductSearchSelect
          products={products}
          value={watchProductId}
          onChange={(value) => {
            setValue('product_id', value);
            setSelectedSerialId(null);
            setSerialSearch('');
          }}
          placeholder="Pesquisar produto..."
        />
      </div>

      {selectedProduct && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="font-medium">{selectedProduct.name}</p>
          <p className="text-sm text-muted-foreground">Código: {selectedProduct.code}</p>
          <p className="text-sm text-muted-foreground">
            Estoque: {selectedProduct.current_stock} {selectedProduct.unit}
          </p>
        </div>
      )}
    </div>
  );

  // Step 2: Serial Number (only for serialized products)
  const step2Content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Número de Série</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setScannerOpen(true)}
          className="gap-2"
        >
          <Camera className="w-4 h-4" />
          Escanear
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar número de série..."
          value={serialSearch}
          onChange={(e) => setSerialSearch(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-3 space-y-2">
          {filteredSerials.map((sn) => (
            <div
              key={sn.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedSerialId === sn.id 
                  ? 'bg-primary/10 border-2 border-primary' 
                  : 'border border-border hover:bg-muted/50'
              }`}
              onClick={() => {
                setSelectedSerialId(sn.id);
                setValue('serial_number_id', sn.id);
              }}
            >
              <Checkbox checked={selectedSerialId === sn.id} />
              <div className="flex-1">
                <span className="font-mono">{sn.serial_number}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                sn.status === 'disponivel' ? 'bg-success/20 text-success' :
                sn.status === 'em_uso' ? 'bg-info/20 text-info' :
                sn.status === 'em_manutencao' ? 'bg-warning/20 text-warning' :
                'bg-destructive/20 text-destructive'
              }`}>
                {sn.status === 'disponivel' ? 'Disponível' :
                 sn.status === 'em_uso' ? 'Em Uso' :
                 sn.status === 'em_manutencao' ? 'Manutenção' : 'Descartado'}
              </span>
            </div>
          ))}
          {filteredSerials.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              {serialSearch ? 'Nenhum serial encontrado' : 'Nenhum serial disponível'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Step 3: Occurrence Type and Details
  const step3Content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base">Tipo de Ocorrência *</Label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(AUDIT_TYPE_LABELS).map(([key, { label, icon, color }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setValue('audit_type', key as 'defeito' | 'furto' | 'garantia')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                watchAuditType === key 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className={color}>{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {!selectedProduct?.is_serialized && (
        <div className="space-y-2">
          <Label className="text-base">Quantidade *</Label>
          <Input
            type="number"
            min={1}
            className="h-12"
            {...register('quantity', { valueAsNumber: true })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-base">Descrição da Ocorrência *</Label>
        <Textarea
          placeholder="Descreva detalhadamente o que aconteceu..."
          rows={5}
          className="resize-none"
          {...register('description')}
        />
        <p className="text-xs text-muted-foreground">Mínimo de 10 caracteres</p>
      </div>
    </div>
  );

  // Build steps based on product type
  const wizardSteps: WizardStep[] = selectedProduct?.is_serialized && serialNumbers && serialNumbers.length > 0
    ? [
        { id: 'product', title: 'Produto', content: step1Content },
        { id: 'serial', title: 'Número de Série', content: step2Content },
        { id: 'details', title: 'Detalhes', content: step3Content },
      ]
    : [
        { id: 'product', title: 'Produto', content: step1Content },
        { id: 'details', title: 'Detalhes', content: step3Content },
      ];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between flex-shrink-0 bg-primary text-primary-foreground">
          <div className="flex items-center gap-2 font-medium text-base flex-1 justify-center">
            Registrar Ocorrência
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
          isSubmitting={createAudit.isPending}
          submitLabel="Registrar"
          className="flex-1 min-h-0"
        />
      </div>

      {/* Scanner Dialog */}
      <ScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
        title="Escanear Número de Série"
        description="Aponte e vá escaneando: cada leitura será registrada."
        continuousMode
      />
    </>,
    document.body
  );
}