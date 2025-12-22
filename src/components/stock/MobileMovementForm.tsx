import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { SignatureCanvas } from './SignatureCanvas';
import { SerialNumberInput } from './SerialNumberInput';
import { MobileFormWizard, WizardStep } from '@/components/ui/mobile-form-wizard';
import { ScannerDialog } from './ScannerDialog';
import { cn } from '@/lib/utils';
import { 
  X, 
  Check, 
  Package,
  Calendar,
  Upload,
  Trash2,
  Plus,
  ChevronsUpDown,
  Barcode,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MovementItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  serial_number_ids?: string[];
  serial_numbers?: string[];
  is_serialized?: boolean;
}

interface MobileMovementFormProps {
  movementType: 'saida' | 'entrada';
  onClose: () => void;
  onSubmit: () => void;
  
  isPending: boolean;
  // Entry fields
  invoiceNumber: string;
  setInvoiceNumber: (v: string) => void;
  invoiceSeries: string;
  setInvoiceSeries: (v: string) => void;
  issueDate: string;
  setIssueDate: (v: string) => void;
  supplierId: string;
  setSupplierId: (v: string) => void;
  invoiceKey: string;
  setInvoiceKey: (v: string) => void;
  attachedFile: File | null;
  setAttachedFile: (f: File | null) => void;
  // Exit fields
  technicianId: string;
  setTechnicianId: (v: string) => void;
  serviceOrderId: string;
  setServiceOrderId: (v: string) => void;
  // Items
  items: MovementItem[];
  setItems: (items: MovementItem[]) => void;
  // Notes & Signature
  notes: string;
  setNotes: (v: string) => void;
  signature: string | null;
  setSignature: (v: string | null) => void;
  // Data
  suppliers: any[];
  technicians: any[];
  serviceOrders: any[];
  products: any[];
  serialNumbers: any[];
  // Item form state
  selectedProductId: string;
  setSelectedProductId: (v: string) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  unitPrice: number;
  setUnitPrice: (v: number) => void;
  selectedSerialIds: string[];
  setSelectedSerialIds: React.Dispatch<React.SetStateAction<string[]>>;
  newSerialNumbers: string[];
  setNewSerialNumbers: (v: string[]) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onToggleSerial: (id: string) => void;
  // Step persistence for camera/orientation changes
  initialStep?: number;
  onStepChange?: (step: number) => void;
}

export function MobileMovementForm({
  movementType,
  onClose,
  onSubmit,
  
  isPending,
  invoiceNumber,
  setInvoiceNumber,
  invoiceSeries,
  setInvoiceSeries,
  issueDate,
  setIssueDate,
  supplierId,
  setSupplierId,
  invoiceKey,
  setInvoiceKey,
  attachedFile,
  setAttachedFile,
  technicianId,
  setTechnicianId,
  serviceOrderId,
  setServiceOrderId,
  items,
  notes,
  setNotes,
  signature,
  setSignature,
  suppliers,
  technicians,
  serviceOrders,
  products,
  serialNumbers,
  selectedProductId,
  setSelectedProductId,
  quantity,
  setQuantity,
  unitPrice,
  setUnitPrice,
  selectedSerialIds,
  setSelectedSerialIds,
  newSerialNumbers,
  setNewSerialNumbers,
  onAddItem,
  onRemoveItem,
  onToggleSerial,
  initialStep = 0,
  onStepChange,
}: MobileMovementFormProps) {
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [serialScannerOpen, setSerialScannerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find((p: any) => p.id === selectedProductId);
  const alreadyUsedSerialIds = items.flatMap(item => item.serial_number_ids || []);
  const availableSerials = serialNumbers.filter(
    (sn: any) => !alreadyUsedSerialIds.includes(sn.id)
  );
  const activeServiceOrders = serviceOrders.filter(
    (so: any) => so.status !== 'concluida' && so.status !== 'cancelada'
  );
  const currentDateTime = format(new Date(), 'dd/MM/yyyy HH:mm');
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const isEntrada = movementType === 'entrada';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
  };

  const handleSerialScan = useCallback((scannedValue: string) => {
    const matchingSerial = availableSerials.find(
      (sn: any) => sn.serial_number === scannedValue
    );

    if (!matchingSerial) {
      toast.error(`Serial ${scannedValue} não encontrado`);
      return;
    }

    setSelectedSerialIds((prev) => {
      if (prev.includes(matchingSerial.id)) {
        toast.info(`Serial ${scannedValue} já selecionado`);
        return prev;
      }

      const next = [...prev, matchingSerial.id];
      setQuantity(next.length);
      toast.success(`Serial ${scannedValue} adicionado!`);
      return next;
    });
  }, [availableSerials, setSelectedSerialIds, setQuantity]);

  // Step 1: Entry = NF data, Exit = Responsible
  const step1Content = isEntrada ? (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          Número da NF <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="Ex: 123456"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          className="h-12 text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Série</Label>
          <Input
            placeholder="Ex: 001"
            value={invoiceSeries}
            onChange={(e) => setInvoiceSeries(e.target.value)}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label>Data Emissão</Label>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fornecedor</Label>
        <Select value={supplierId || "none"} onValueChange={(val) => setSupplierId(val === "none" ? "" : val)}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {suppliers.map((supplier: any) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Chave NFe (opcional)</Label>
        <Input
          placeholder="44 dígitos"
          maxLength={44}
          value={invoiceKey}
          onChange={(e) => setInvoiceKey(e.target.value)}
          className="h-12 font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label>Anexar PDF/Imagem</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-12 gap-2"
        >
          <Upload className="h-4 w-4" />
          {attachedFile ? attachedFile.name : 'Escolher arquivo...'}
        </Button>
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          Técnico / Solicitante <span className="text-destructive">*</span>
        </Label>
        <Select value={technicianId} onValueChange={setTechnicianId}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Quem está retirando?" />
          </SelectTrigger>
          <SelectContent>
            {technicians.map((tech: any) => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Vincular a O.S. (opcional)</Label>
        <Select value={serviceOrderId || "none"} onValueChange={(val) => setServiceOrderId(val === "none" ? "" : val)}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Selecione uma O.S..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            {activeServiceOrders.map((so: any) => (
              <SelectItem key={so.id} value={so.id}>
                #{so.order_number} - {so.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <span className="text-muted-foreground">Data/Hora:</span>
        <span className="font-medium">{currentDateTime}</span>
      </div>
    </div>
  );

  // Step 2: Items
  const step2Content = (
    <div className="space-y-4">
      {/* Add Item */}
      <div className="space-y-3 p-3 border rounded-lg bg-muted/10">
        <div className="space-y-2">
          <Label>Material <span className="text-destructive">*</span></Label>
          <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full h-12 justify-between font-normal"
              >
                {selectedProductId
                  ? products.find((p: any) => p.id === selectedProductId)?.name
                  : "Buscar material..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-3rem)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Digite para buscar..." />
                <CommandList>
                  <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                  <CommandGroup>
                    {products
                      .filter((p: any) => p.is_active && (isEntrada || (p.current_stock || 0) > 0))
                      .map((product: any) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => {
                            setSelectedProductId(product.id);
                            setSelectedSerialIds([]);
                            setNewSerialNumbers([]);
                            setProductSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProductId === product.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground flex gap-2">
                              <span>Estoque: {product.current_stock || 0}</span>
                              {product.is_serialized && (
                                <Badge variant="outline" className="text-[10px]">Serializado</Badge>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedProduct && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={selectedProduct.is_serialized && !isEntrada}
                className="h-12"
              />
            </div>
            {isEntrada && (
              <div className="space-y-2">
                <Label>Valor Unit.</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="h-12"
                />
              </div>
            )}
          </div>
        )}

        {/* Serial Numbers for SAÍDA */}
        {selectedProduct?.is_serialized && !isEntrada && (
          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Barcode className="h-4 w-4 text-primary" />
                <Label className="text-sm">Números de Série</Label>
                <Badge variant="secondary" className="text-xs">{availableSerials.length} disp.</Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSerialScannerOpen(true)}
                disabled={availableSerials.length === 0}
                className="gap-1"
              >
                <Camera className="h-4 w-4" />
                Escanear
              </Button>
            </div>
            {selectedSerialIds.length > 0 && (
              <div className="text-sm text-primary font-medium">
                {selectedSerialIds.length} serial(is) selecionado(s)
              </div>
            )}
            {availableSerials.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Nenhum disponível
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {availableSerials.map((sn: any) => (
                  <div
                    key={sn.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded border cursor-pointer",
                      selectedSerialIds.includes(sn.id)
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    )}
                    onClick={() => onToggleSerial(sn.id)}
                  >
                    <Checkbox checked={selectedSerialIds.includes(sn.id)} />
                    <span className="font-mono text-xs truncate">{sn.serial_number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Serial Numbers for ENTRADA */}
        {selectedProduct?.is_serialized && isEntrada && (
          <SerialNumberInput
            quantity={quantity}
            value={newSerialNumbers}
            onChange={setNewSerialNumbers}
            onQuantityChange={setQuantity}
            productName={selectedProduct.name}
          />
        )}

        <Button
          type="button"
          onClick={onAddItem}
          disabled={!selectedProductId}
          className={cn(
            "w-full h-12 gap-2",
            isEntrada ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"
          )}
        >
          <Plus className="h-4 w-4" />
          Adicionar Item
        </Button>
      </div>

      {/* Items List */}
      {items.length > 0 ? (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">{items.length} item(ns) adicionado(s)</Label>
          {items.map((item) => (
            <div key={item.id} className="p-3 border rounded-lg bg-background">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product_name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>Qtd: {item.quantity}</span>
                    {isEntrada && (
                      <span className="text-emerald-600 font-medium">
                        R$ {(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveItem(item.id)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {isEntrada && (
            <div className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="text-lg font-bold text-emerald-600">R$ {totalValue.toFixed(2)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Nenhum item adicionado</p>
        </div>
      )}
    </div>
  );

  // Step 3: Notes
  const step3Content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Observações (opcional)</Label>
        <Textarea
          placeholder="Adicione informações relevantes..."
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="text-base"
        />
      </div>

      {/* Summary */}
      <div className="p-4 bg-muted/30 rounded-lg space-y-2">
        <p className="font-medium">Resumo</p>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Itens:</span>
            <span>{items.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantidade total:</span>
            <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          </div>
          {isEntrada && (
            <div className="flex justify-between font-medium">
              <span>Valor total:</span>
              <span className="text-emerald-600">R$ {totalValue.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 4: Signature
  const step4Content = (
    <SignatureCanvas 
      onSignatureChange={setSignature}
      inline={true}
    />
  );

  const wizardSteps: WizardStep[] = isEntrada
    ? [
        { id: 'nf', title: 'Nota Fiscal', content: step1Content },
        { id: 'items', title: 'Itens', content: step2Content },
        { id: 'notes', title: 'Observações', content: step3Content },
        { id: 'signature', title: 'Assinatura', content: step4Content, landscape: true },
      ]
    : [
        { id: 'responsible', title: 'Responsável', content: step1Content },
        { id: 'items', title: 'Itens', content: step2Content },
        { id: 'notes', title: 'Observações', content: step3Content },
        { id: 'signature', title: 'Assinatura', content: step4Content, landscape: true },
      ];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <div className={cn(
          "px-4 py-4 flex items-center justify-between flex-shrink-0 relative",
          isEntrada ? "bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground"
        )}>
          <div className="flex items-center gap-2 font-medium text-base flex-1 justify-center">
            {isEntrada ? 'Entrada de Material' : 'Saída de Material'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        
        {/* Wizard */}
        <MobileFormWizard
          steps={wizardSteps}
          onComplete={onSubmit}
          onCancel={onClose}
          isSubmitting={isPending}
          submitLabel={isEntrada ? 'Confirmar Entrada' : 'Confirmar Saída'}
          className="flex-1 min-h-0"
          initialStep={initialStep}
          onStepChange={onStepChange}
        />
      </div>

      {/* Serial Scanner Dialog for SAÍDA */}
      <ScannerDialog
        open={serialScannerOpen}
        onOpenChange={setSerialScannerOpen}
        onScan={handleSerialScan}
        title="Escanear Número de Série"
        description="Posicione o código de barras do item dentro da área destacada"
        scannedItems={selectedSerialIds.map(id => {
          const sn = serialNumbers.find((s: any) => s.id === id);
          return sn?.serial_number || id;
        })}
        continuousMode={true}
      />
    </>,
    document.body
  );
}