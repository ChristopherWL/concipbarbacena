import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProducts } from '@/hooks/useProducts';
import { useTechnicians } from '@/hooks/useTeams';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { useCreateStockMovement } from '@/hooks/useStockMovements';
import { useCreateInvoice, useCreateStandaloneInvoice } from '@/hooks/useInvoices';
import { SignatureCanvas } from '@/components/stock/SignatureCanvas';
import { SignatureModal } from '@/components/ui/signature-modal';
import { MovementHistory } from '@/components/stock/MovementHistory';
import { SerialNumberInput } from '@/components/stock/SerialNumberInput';
import { MobileMovementForm } from '@/components/stock/MobileMovementForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { 
  Loader2, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  Check, 
  ChevronsUpDown,
  Upload,
  FileText,
  User,
  Package,
  Calendar,
  Building2,
  Hash,
  Barcode,
  AlertCircle,
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { MovementType } from '@/types/stock';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

export default function Movimentacao() {
  const navigate = useNavigate();
  const { user, tenant, isLoading: authLoading } = useAuthContext();
  const isMobile = useIsMobile();
  const { data: products = [] } = useProducts();
  const { data: technicians = [] } = useTechnicians();
  const { data: serviceOrders = [] } = useServiceOrders();
  const { data: suppliers = [] } = useSuppliers();
  const createMovement = useCreateStockMovement();
  const createInvoice = useCreateInvoice();
  const createStandaloneInvoice = useCreateStandaloneInvoice();

  const [movementType, setMovementType] = useState<'saida' | 'entrada' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  
  // Common fields
  const [technicianId, setTechnicianId] = useState<string>('');
  const [serviceOrderId, setServiceOrderId] = useState<string>('');
  const [items, setItems] = useState<MovementItem[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  
  // Entry (NF) specific fields
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceSeries, setInvoiceSeries] = useState<string>('');
  const [invoiceKey, setInvoiceKey] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New item form state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [selectedSerialIds, setSelectedSerialIds] = useState<string[]>([]);
  const [newSerialNumbers, setNewSerialNumbers] = useState<string[]>([]);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  
  const { data: serialNumbers = [] } = useSerialNumbers(
    selectedProductId,
    movementType === 'saida' ? 'disponivel' : undefined
  );

  const alreadyUsedSerialIds = items.flatMap(item => item.serial_number_ids || []);
  const availableSerials = serialNumbers.filter(
    sn => !alreadyUsedSerialIds.includes(sn.id)
  );

  const activeServiceOrders = serviceOrders.filter(
    so => so.status !== 'concluida' && so.status !== 'cancelada'
  );

  const currentDateTime = useMemo(() => {
    return format(new Date(), 'dd/MM/yyyy HH:mm');
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(selectedProduct.cost_price || 0);
      setSelectedSerialIds([]);
      setNewSerialNumbers([]);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct?.is_serialized && movementType === 'saida') {
      setQuantity(selectedSerialIds.length);
    }
  }, [selectedSerialIds, selectedProduct?.is_serialized, movementType]);

  const handleOpenDialog = (type: 'saida' | 'entrada') => {
    setMovementType(type);
    setWizardStep(0);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleToggleSerial = (serialId: string) => {
    const newSelection = selectedSerialIds.includes(serialId)
      ? selectedSerialIds.filter(id => id !== serialId)
      : [...selectedSerialIds, serialId];
    
    setSelectedSerialIds(newSelection);
    // Update quantity automatically when toggling serials
    if (selectedProduct?.is_serialized && movementType === 'saida') {
      setQuantity(newSelection.length);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error('Selecione um material');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (product.is_serialized && movementType === 'saida' && selectedSerialIds.length === 0) {
      toast.error('Selecione pelo menos um número de série');
      return;
    }

    if (product.is_serialized && movementType === 'entrada') {
      if (newSerialNumbers.length === 0) {
        toast.error('Adicione os números de série');
        return;
      }
      if (newSerialNumbers.length !== quantity) {
        toast.error(`Você precisa adicionar ${quantity} número(s) de série`);
        return;
      }
    }

    if (movementType === 'saida' && !product.is_serialized) {
      const alreadyAdded = items
        .filter(i => i.product_id === selectedProductId)
        .reduce((sum, i) => sum + i.quantity, 0);
      
      if (alreadyAdded + quantity > (product.current_stock || 0)) {
        toast.error('Estoque insuficiente');
        return;
      }
    }

    const selectedSerials = serialNumbers.filter(sn => selectedSerialIds.includes(sn.id));

    const newItem: MovementItem = {
      id: crypto.randomUUID(),
      product_id: selectedProductId,
      product_name: product.name,
      quantity: product.is_serialized 
        ? (movementType === 'saida' ? selectedSerialIds.length : newSerialNumbers.length)
        : quantity,
      unit_price: unitPrice,
      serial_number_ids: selectedSerialIds.length > 0 ? selectedSerialIds : undefined,
      serial_numbers: movementType === 'entrada' && product.is_serialized
        ? newSerialNumbers
        : selectedSerials.map(s => s.serial_number),
      is_serialized: product.is_serialized,
    };

    setItems([...items, newItem]);
    setSelectedProductId('');
    setQuantity(1);
    setUnitPrice(0);
    setSelectedSerialIds([]);
    setNewSerialNumbers([]);
    toast.success('Item adicionado');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const resetForm = () => {
    setItems([]);
    setTechnicianId('');
    setServiceOrderId('');
    setSignature(null);
    setNotes('');
    setInvoiceNumber('');
    setInvoiceSeries('');
    setInvoiceKey('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setSupplierId('');
    setAttachedFile(null);
    setMovementType(null);
  };

  const handleSubmitSaida = async () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    if (!technicianId) {
      toast.error('Selecione o técnico responsável');
      return;
    }

    const movementItems = items.flatMap(item => {
      if (item.is_serialized && item.serial_number_ids && item.serial_numbers) {
        return item.serial_number_ids.map((serialId, index) => ({
          product_id: item.product_id,
          quantity: 1,
          serial_number_id: serialId,
          serial_number: item.serial_numbers![index],
        }));
      }
      return [{
        product_id: item.product_id,
        quantity: item.quantity,
        serial_number_id: undefined,
        serial_number: undefined,
      }];
    });

    await createMovement.mutateAsync({
      items: movementItems,
      movement_type: 'saida' as MovementType,
      technician_id: technicianId,
      service_order_id: serviceOrderId || undefined,
      reason: serviceOrderId 
        ? `Vinculado à OS #${serviceOrders.find(so => so.id === serviceOrderId)?.order_number}` 
        : `Saída para ${technicians.find(t => t.id === technicianId)?.name}`,
    });

    handleCloseDialog();
  };

  const uploadInvoiceFile = async (file: File): Promise<string | null> => {
    if (!tenant?.id) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${tenant.id}/invoices/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('tenant-assets')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      throw new Error('Erro ao fazer upload do arquivo');
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleSubmitEntrada = async () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    if (!invoiceNumber.trim()) {
      toast.error('Informe o número da nota fiscal');
      return;
    }

    for (const item of items) {
      if (item.is_serialized && (!item.serial_numbers || item.serial_numbers.length === 0)) {
        toast.error(`Informe o(s) número(s) de série para ${item.product_name}`);
        return;
      }
    }

    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Upload file if attached
    let pdfUrl: string | null = null;
    if (attachedFile) {
      try {
        pdfUrl = await uploadInvoiceFile(attachedFile);
      } catch (error) {
        toast.error('Erro ao fazer upload do anexo');
        return;
      }
    }

    await createInvoice.mutateAsync({
      invoice: {
        supplier_id: supplierId || null,
        invoice_number: invoiceNumber,
        invoice_series: invoiceSeries || null,
        invoice_key: invoiceKey || null,
        issue_date: issueDate,
        total_value: totalValue,
        discount: 0,
        freight: 0,
        taxes: 0,
        notes: notes || null,
        pdf_url: pdfUrl,
      },
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        serial_numbers: item.serial_numbers,
      })),
    });

    handleCloseDialog();
  };

  const handleSubmit = async () => {
    if (movementType === 'saida') {
      await handleSubmitSaida();
    } else {
      await handleSubmitEntrada();
    }
  };

  if (authLoading) {
    return <PageLoading text="Carregando movimentação" />;
  }

  if (!user) return null;

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const isPending = createMovement.isPending || createInvoice.isPending || createStandaloneInvoice.isPending;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-fade-in px-2 sm:px-4" data-tour="movement-content">
        {/* Page Header */}
        <div className="flex flex-col items-center text-center gap-2 sm:-mt-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Movimentação de Estoque
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Escolha o tipo de movimentação
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Saída Card */}
          <Card 
            className="cursor-pointer group hover:shadow-xl transition-all duration-300 border-2 hover:border-destructive/50 relative overflow-hidden"
            onClick={() => handleOpenDialog('saida')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="text-center pb-2 sm:pb-4">
              <div className="mx-auto w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <ArrowUp className="h-7 w-7 sm:h-10 sm:w-10 text-destructive" />
              </div>
              <CardTitle className="text-lg sm:text-2xl">Saída de Material</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Retirada de itens do estoque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 hidden sm:block">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <User className="h-4 w-4 text-destructive" />
                <span>Para técnicos ou equipes</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 text-destructive" />
                <span>Vincular a Ordem de Serviço</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Barcode className="h-4 w-4 text-destructive" />
                <span>Controle por número de série</span>
              </div>
            </CardContent>
            <CardContent className="pt-0 sm:pt-2">
              <Button variant="destructive" className="w-full gap-2" size="sm">
                <ArrowUp className="h-4 w-4" />
                <span className="hidden sm:inline">Registrar</span> Saída
              </Button>
            </CardContent>
          </Card>

          {/* Entrada Card */}
          <Card 
            className="cursor-pointer group hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-500/50 relative overflow-hidden"
            onClick={() => handleOpenDialog('entrada')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="text-center pb-2 sm:pb-4">
              <div className="mx-auto w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <ArrowDown className="h-7 w-7 sm:h-10 sm:w-10 text-emerald-600" />
              </div>
              <CardTitle className="text-lg sm:text-2xl">Entrada de Material</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Adicionar itens ao estoque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 hidden sm:block">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Registro de Nota Fiscal</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span>Vincular ao Fornecedor</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Hash className="h-4 w-4 text-emerald-600" />
                <span>Cadastro de números de série</span>
              </div>
            </CardContent>
            <CardContent className="pt-0 sm:pt-2">
              <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" size="sm">
                <ArrowDown className="h-4 w-4" />
                <span className="hidden sm:inline">Registrar</span> Entrada
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* History Section */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Movimentações
          </h2>
          <MovementHistory />
        </div>
      </div>

      {/* Mobile Movement Form */}
      {isMobile && dialogOpen && movementType && (
        <MobileMovementForm
          movementType={movementType}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          
          isPending={isPending}
          invoiceNumber={invoiceNumber}
          setInvoiceNumber={setInvoiceNumber}
          invoiceSeries={invoiceSeries}
          setInvoiceSeries={setInvoiceSeries}
          issueDate={issueDate}
          setIssueDate={setIssueDate}
          supplierId={supplierId}
          setSupplierId={setSupplierId}
          invoiceKey={invoiceKey}
          setInvoiceKey={setInvoiceKey}
          attachedFile={attachedFile}
          setAttachedFile={setAttachedFile}
          technicianId={technicianId}
          setTechnicianId={setTechnicianId}
          serviceOrderId={serviceOrderId}
          setServiceOrderId={setServiceOrderId}
          items={items}
          setItems={setItems}
          notes={notes}
          setNotes={setNotes}
          signature={signature}
          setSignature={setSignature}
          suppliers={suppliers}
          technicians={technicians}
          serviceOrders={serviceOrders}
          products={products}
          serialNumbers={serialNumbers}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          quantity={quantity}
          setQuantity={setQuantity}
          unitPrice={unitPrice}
          setUnitPrice={setUnitPrice}
          selectedSerialIds={selectedSerialIds}
          setSelectedSerialIds={setSelectedSerialIds}
          newSerialNumbers={newSerialNumbers}
          setNewSerialNumbers={setNewSerialNumbers}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onToggleSerial={handleToggleSerial}
          initialStep={wizardStep}
          onStepChange={setWizardStep}
        />
      )}

      {/* Desktop Movement Dialog */}
      <Dialog open={!isMobile && dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0 bg-transparent shadow-none border-0 [&>button]:hidden">
          <div className="bg-background rounded-xl overflow-y-auto max-h-[90vh] shadow-2xl scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader className={cn(
            "px-6 py-4 text-center",
            movementType === 'saida' 
              ? "bg-destructive text-destructive-foreground" 
              : "bg-emerald-600 text-white"
          )}>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              {movementType === 'saida' ? (
                <>
                  <ArrowUp className="h-5 w-5" />
                  Registrar Saída de Material
                </>
              ) : (
                <>
                  <ArrowDown className="h-5 w-5" />
                  Registrar Entrada de Material
                </>
              )}
            </DialogTitle>
            <p className="text-sm opacity-90 mt-1 text-center">
              {movementType === 'saida' 
                ? 'Retirada de itens do estoque para técnicos ou O.S.' 
                : 'Entrada de materiais via Nota Fiscal'
              }
            </p>
          </DialogHeader>

          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Entry specific fields */}
            {movementType === 'entrada' && (
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2 text-base sm:text-lg font-medium">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  Dados da Nota Fiscal
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number" className="flex items-center gap-1">
                      Número da NF <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="invoice_number"
                      placeholder="Ex: 123456"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoice_series">Série</Label>
                    <Input
                      id="invoice_series"
                      placeholder="Ex: 001"
                      value={invoiceSeries}
                      onChange={(e) => setInvoiceSeries(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issue_date" className="flex items-center gap-1">
                      Data de Emissão <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Select value={supplierId || "none"} onValueChange={(val) => setSupplierId(val === "none" ? "" : val)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label>Chave de Acesso NFe</Label>
                    <Input
                      placeholder="44 dígitos (opcional)"
                      maxLength={44}
                      value={invoiceKey}
                      onChange={(e) => setInvoiceKey(e.target.value)}
                      className="bg-background font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Anexar PDF/Imagem</Label>
                    <div className="flex items-center gap-2">
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
                        className="gap-2 flex-1"
                      >
                        <Upload className="h-4 w-4" />
                        {attachedFile ? attachedFile.name : 'Escolher arquivo...'}
                      </Button>
                      {attachedFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setAttachedFile(null)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Saída specific fields */}
            {movementType === 'saida' && (
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2 text-base sm:text-lg font-medium">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                  Responsável pela Retirada
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Técnico / Solicitante <span className="text-destructive">*</span>
                    </Label>
                    <Select value={technicianId} onValueChange={setTechnicianId}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Quem está retirando?" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((tech) => (
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
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione uma O.S..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {activeServiceOrders.map((so) => (
                          <SelectItem key={so.id} value={so.id}>
                            #{so.order_number} - {so.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Data/Hora:</span>
                  <span className="font-medium">{currentDateTime}</span>
                </div>
              </div>
            )}

            {/* Items Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-base sm:text-lg font-medium">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Itens da Movimentação
              </div>

              {/* Add Item Form */}
              <div className="p-3 sm:p-4 border-2 border-dashed rounded-lg space-y-3 sm:space-y-4 bg-muted/10">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  Adicionar Item
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Material <span className="text-destructive">*</span></Label>
                    <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal bg-background"
                        >
                          {selectedProductId
                            ? products.find(p => p.id === selectedProductId)?.name
                            : "Buscar material..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0 z-[100]" align="start">
                        <Command>
                          <CommandInput placeholder="Digite para buscar..." />
                          <CommandList>
                            <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                            <CommandGroup>
                              {products
                                .filter(p => p.is_active && (movementType === 'entrada' || (p.current_stock || 0) > 0))
                                .map((product) => (
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
                                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span>Estoque: {product.current_stock || 0} {product.unit}</span>
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
                    <>
                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min={1}
                          max={movementType === 'saida' && !selectedProduct.is_serialized ? selectedProduct.current_stock || 1 : undefined}
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          disabled={selectedProduct.is_serialized && movementType === 'saida'}
                          className="bg-background"
                          placeholder="Qtd"
                        />
                      </div>

                      {movementType === 'entrada' && (
                        <div className="space-y-2">
                          <Label>Valor Unit. (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(Number(e.target.value))}
                            className="bg-background"
                            placeholder="0,00"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Serial Numbers for SAÍDA */}
                {selectedProduct?.is_serialized && movementType === 'saida' && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-primary" />
                      <Label>Selecione os Números de Série</Label>
                      <Badge variant="secondary">{availableSerials.length} disponíveis</Badge>
                    </div>
                    {availableSerials.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        Nenhum número de série disponível
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {availableSerials.map((sn) => (
                          <div
                            key={sn.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded border cursor-pointer transition-all",
                              selectedSerialIds.includes(sn.id)
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => handleToggleSerial(sn.id)}
                          >
                            <Checkbox checked={selectedSerialIds.includes(sn.id)} />
                            <span className="font-mono text-xs truncate">{sn.serial_number}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedSerialIds.length > 0 && (
                      <Badge className="bg-primary">{selectedSerialIds.length} selecionado(s)</Badge>
                    )}
                  </div>
                )}

                {/* Serial Numbers for ENTRADA */}
                {selectedProduct?.is_serialized && movementType === 'entrada' && (
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
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className={cn(
                    "w-full gap-2",
                    movementType === 'saida' ? "bg-destructive hover:bg-destructive/90" : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar à Lista
                </Button>
              </div>

              {/* Items List - Mobile Cards */}
              {items.length > 0 && (
                <div className="sm:hidden space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg bg-background">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product_name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>Qtd: {item.quantity}</span>
                            {movementType === 'entrada' && (
                              <span className="text-emerald-600 font-medium">
                                R$ {(item.quantity * item.unit_price).toFixed(2)}
                              </span>
                            )}
                          </div>
                          {item.serial_numbers && item.serial_numbers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.serial_numbers.slice(0, 2).map((sn, idx) => (
                                <Badge key={idx} variant="secondary" className="font-mono text-xs">
                                  {sn}
                                </Badge>
                              ))}
                              {item.serial_numbers.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.serial_numbers.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {movementType === 'entrada' && (
                    <div className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold text-emerald-600">R$ {totalValue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Items Table - Desktop */}
              {items.length > 0 && (
                <div className="hidden sm:block border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Item</TableHead>
                        <TableHead className="w-20 text-center">Qtd</TableHead>
                        <TableHead>Nº Série</TableHead>
                        {movementType === 'entrada' && (
                          <TableHead className="w-28 text-right">Valor</TableHead>
                        )}
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell>
                            {item.serial_numbers && item.serial_numbers.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.serial_numbers.slice(0, 3).map((sn, idx) => (
                                  <Badge key={idx} variant="secondary" className="font-mono text-xs">
                                    {sn}
                                  </Badge>
                                ))}
                                {item.serial_numbers.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.serial_numbers.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          {movementType === 'entrada' && (
                            <TableCell className="text-right font-medium">
                              R$ {(item.quantity * item.unit_price).toFixed(2)}
                            </TableCell>
                          )}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {movementType === 'entrada' && (
                    <div className="p-4 bg-muted/30 flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <span className="text-xl font-bold text-emerald-600">R$ {totalValue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {items.length === 0 && (
                <div className="text-center py-6 sm:py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                  <p className="text-sm sm:text-base">Nenhum item adicionado</p>
                  <p className="text-xs sm:text-sm">Use o formulário acima para adicionar materiais</p>
                </div>
              )}
            </div>

            {/* Notes & Signature */}
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 text-base sm:text-lg font-medium">
                Observações e Assinatura
              </div>
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  placeholder="Adicione informações relevantes..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Assinatura</Label>
                {signature ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-16 border rounded bg-background flex items-center justify-center">
                      <img src={signature} alt="Assinatura" className="max-h-14" />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowSignatureModal(true)}>
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full h-16 border-dashed",
                      movementType === 'entrada' ? 'border-emerald-300 hover:border-emerald-400' : ''
                    )}
                    onClick={() => setShowSignatureModal(true)}
                  >
                    Capturar Assinatura
                  </Button>
                )}
              </div>

              <SignatureModal
                open={showSignatureModal}
                onClose={() => setShowSignatureModal(false)}
                onSave={(sig) => setSignature(sig)}
                title={movementType === 'entrada' ? 'Assinatura - Entrada' : 'Assinatura - Saída'}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1 min-w-[100px]"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button
                className={cn(
                  "flex-1 min-w-[140px] gap-2 text-white",
                  movementType === 'saida' 
                    ? 'bg-destructive hover:bg-destructive/90' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                )}
                onClick={handleSubmit}
                disabled={isPending || items.length === 0}
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                {movementType === 'saida' ? 'Confirmar Saída' : 'Confirmar Entrada'}
              </Button>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
