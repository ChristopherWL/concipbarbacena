import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Package, Camera, Search } from 'lucide-react';
import { useCreateStockAudit } from '@/hooks/useStockAudits';
import { useProducts } from '@/hooks/useProducts';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { toast } from 'sonner';
import { MobileFormWizard, WizardStep } from '@/components/ui/mobile-form-wizard';
import { ProductSearchSelect } from './ProductSearchSelect';
import { ScannerDialog } from './ScannerDialog';

const bulkSchema = z.object({
  product_id: z.string().min(1, 'Selecione um produto'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  quantity: z.number().min(1, 'Quantidade mínima é 1').optional(),
});

type BulkFormData = z.infer<typeof bulkSchema>;

interface BulkWarrantyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkWarrantyDialog({ open, onOpenChange }: BulkWarrantyDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedSerialIds, setSelectedSerialIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [serialSearch, setSerialSearch] = useState('');
  const prevProductIdRef = useRef<string>('');
  
  const { data: products } = useProducts();
  const { data: serialNumbers } = useSerialNumbers(selectedProductId || undefined);
  const createAudit = useCreateStockAudit();

  const {
    register,
    setValue,
    watch,
    reset,
  } = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      product_id: '',
      description: '',
      quantity: 1,
    },
  });

  const watchProductId = watch('product_id');
  const selectedProduct = products?.find(p => p.id === watchProductId);
  const availableSerials = serialNumbers?.filter(s => s.status === 'em_manutencao') || [];
  const filteredSerials = availableSerials.filter(s => 
    s.serial_number.toLowerCase().includes(serialSearch.toLowerCase())
  );

  const handleProductChange = useCallback((value: string) => {
    setValue('product_id', value);
    if (value !== prevProductIdRef.current) {
      prevProductIdRef.current = value;
      setSelectedProductId(value);
      setSelectedSerialIds([]);
      setSerialSearch('');
    }
  }, [setValue]);

  useEffect(() => {
    if (!open) {
      reset();
      setSelectedSerialIds([]);
      setSelectedProductId('');
      setSerialSearch('');
      prevProductIdRef.current = '';
    }
  }, [open, reset]);

  const toggleSerial = useCallback((serialId: string) => {
    setSelectedSerialIds(prev => 
      prev.includes(serialId) 
        ? prev.filter(id => id !== serialId)
        : [...prev, serialId]
    );
  }, []);

  const selectAllSerials = useCallback(() => {
    if (selectedSerialIds.length === filteredSerials.length) {
      setSelectedSerialIds([]);
    } else {
      setSelectedSerialIds(filteredSerials.map(s => s.id));
    }
  }, [selectedSerialIds.length, filteredSerials]);

  const handleScan = useCallback((scannedValue: string) => {
    const matchedSerial = availableSerials.find(
      s => s.serial_number.toLowerCase() === scannedValue.toLowerCase()
    );
    if (matchedSerial && !selectedSerialIds.includes(matchedSerial.id)) {
      setSelectedSerialIds(prev => [...prev, matchedSerial.id]);
      toast.success(`Serial ${scannedValue} adicionado!`);
    } else if (!matchedSerial) {
      toast.error(`Serial ${scannedValue} não encontrado`);
    } else {
      toast.info(`Serial ${scannedValue} já selecionado`);
    }
  }, [availableSerials, selectedSerialIds]);

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

    setIsSubmitting(true);
    
    try {
      if (selectedProduct?.is_serialized && selectedSerialIds.length > 0) {
        for (const serialId of selectedSerialIds) {
          await createAudit.mutateAsync({
            product_id: data.product_id,
            serial_number_id: serialId,
            audit_type: 'garantia',
            quantity: 1,
            description: data.description,
            status: 'enviado',
          });
        }
        toast.success(`${selectedSerialIds.length} itens enviados para garantia`);
      } else {
        await createAudit.mutateAsync({
          product_id: data.product_id,
          serial_number_id: null,
          audit_type: 'garantia',
          quantity: data.quantity || 1,
          description: data.description,
          status: 'enviado',
        });
        toast.success('Garantia registrada com sucesso');
      }
      
      reset();
      setSelectedSerialIds([]);
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao registrar: ' + error.message);
    } finally {
      setIsSubmitting(false);
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
            {selectedProduct.is_serialized 
              ? `${availableSerials.length} itens em manutenção`
              : `Estoque: ${selectedProduct.current_stock} ${selectedProduct.unit}`
            }
          </p>
        </div>
      )}
    </div>
  );

  // Step 2: Serial Numbers (for serialized products)
  const step2Content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Selecionar Itens</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAllSerials}>
            {selectedSerialIds.length === filteredSerials.length ? 'Desmarcar' : 'Selecionar'} Todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setScannerOpen(true)}
            className="gap-1"
          >
            <Camera className="w-4 h-4" />
            Escanear
          </Button>
        </div>
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

      <p className="text-sm text-muted-foreground">
        {selectedSerialIds.length} de {filteredSerials.length} selecionados
      </p>

      <ScrollArea className="h-[280px] border rounded-lg">
        <div className="p-3 space-y-2">
          {filteredSerials.map((serial) => (
            <div 
              key={serial.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedSerialIds.includes(serial.id) 
                  ? 'bg-primary/10 border-2 border-primary' 
                  : 'border border-border hover:bg-muted/50'
              }`}
              onClick={() => toggleSerial(serial.id)}
            >
              <Checkbox checked={selectedSerialIds.includes(serial.id)} />
              <span className="font-mono flex-1">{serial.serial_number}</span>
            </div>
          ))}
          {filteredSerials.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              {serialSearch ? 'Nenhum serial encontrado' : 'Nenhum item em manutenção'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Step 3: Details
  const step3Content = (
    <div className="space-y-4">
      {!selectedProduct?.is_serialized && (
        <div className="space-y-2">
          <Label className="text-base">Quantidade *</Label>
          <Input
            type="number"
            min={1}
            max={selectedProduct?.current_stock}
            className="h-12"
            {...register('quantity', { valueAsNumber: true })}
          />
          <p className="text-xs text-muted-foreground">
            Disponível: {selectedProduct?.current_stock} {selectedProduct?.unit}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-base">Descrição/Motivo da Garantia *</Label>
        <Textarea
          placeholder="Ex: Lote com defeito de fabricação..."
          rows={5}
          className="resize-none"
          {...register('description')}
        />
        <p className="text-xs text-muted-foreground">Mínimo de 10 caracteres</p>
      </div>

      {selectedProduct?.is_serialized && selectedSerialIds.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            {selectedSerialIds.length} item(ns) serão enviados para garantia
          </p>
        </div>
      )}
    </div>
  );

  const wizardSteps: WizardStep[] = selectedProduct?.is_serialized && availableSerials.length > 0
    ? [
        { id: 'product', title: 'Produto', content: step1Content },
        { id: 'serial', title: 'Números de Série', content: step2Content },
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
            <Package className="w-5 h-5" />
            Cadastro em Lote - Garantia
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
          submitLabel={selectedProduct?.is_serialized 
            ? `Registrar ${selectedSerialIds.length} Itens` 
            : 'Registrar Garantia'}
          className="flex-1 min-h-0"
        />
      </div>

      {/* Scanner Dialog */}
      <ScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScan}
        title="Escanear Número de Série"
        description="Posicione o código de barras do item dentro da área destacada"
      />
    </>,
    document.body
  );
}