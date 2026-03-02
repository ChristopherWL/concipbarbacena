import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Shield, Package, Search, Camera } from 'lucide-react';
import { useCreateStockAudit } from '@/hooks/useStockAudits';
import { useProducts } from '@/hooks/useProducts';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { toast } from 'sonner';
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

  const showSerials = selectedProduct?.is_serialized && serialNumbers && serialNumbers.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Registrar Ocorrência</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-5 pb-2">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label>Produto *</Label>
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
                {selectedProduct && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-muted-foreground">Código: {selectedProduct.code} · Estoque: {selectedProduct.current_stock} {selectedProduct.unit}</p>
                  </div>
                )}
              </div>

              {/* Serial Number */}
              {showSerials && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Número de Série</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setScannerOpen(true)} className="gap-1.5 h-7 text-xs">
                      <Camera className="w-3.5 h-3.5" />
                      Escanear
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Pesquisar série..." value={serialSearch} onChange={(e) => setSerialSearch(e.target.value)} className="pl-9" />
                  </div>
                  <ScrollArea className="h-[160px] border rounded-lg">
                    <div className="p-2 space-y-1">
                      {filteredSerials.map((sn) => (
                        <div
                          key={sn.id}
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-sm ${
                            selectedSerialId === sn.id ? 'bg-primary/10 border border-primary' : 'border border-transparent hover:bg-muted/50'
                          }`}
                          onClick={() => { setSelectedSerialId(sn.id); setValue('serial_number_id', sn.id); }}
                        >
                          <Checkbox checked={selectedSerialId === sn.id} />
                          <span className="font-mono flex-1">{sn.serial_number}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            sn.status === 'disponivel' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            sn.status === 'em_uso' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            sn.status === 'em_manutencao' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {sn.status === 'disponivel' ? 'Disponível' : sn.status === 'em_uso' ? 'Em Uso' : sn.status === 'em_manutencao' ? 'Manutenção' : 'Descartado'}
                          </span>
                        </div>
                      ))}
                      {filteredSerials.length === 0 && (
                        <p className="text-muted-foreground text-center py-4 text-sm">
                          {serialSearch ? 'Nenhum serial encontrado' : 'Nenhum serial disponível'}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Audit Type */}
              <div className="space-y-2">
                <Label>Tipo de Ocorrência *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(AUDIT_TYPE_LABELS).map(([key, { label, icon, color }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue('audit_type', key as 'defeito' | 'furto' | 'garantia')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                        watchAuditType === key ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className={color}>{icon}</span>
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              {!selectedProduct?.is_serialized && (
                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input type="number" min={1} {...register('quantity', { valueAsNumber: true })} />
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label>Descrição da Ocorrência *</Label>
                <Textarea placeholder="Descreva detalhadamente o que aconteceu..." rows={4} className="resize-none" {...register('description')} />
                <p className="text-xs text-muted-foreground">Mínimo de 10 caracteres</p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={onSubmit} disabled={createAudit.isPending}>
              {createAudit.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
        title="Escanear Número de Série"
        description="Aponte e vá escaneando: cada leitura será registrada."
        continuousMode
      />
    </>
  );
}
