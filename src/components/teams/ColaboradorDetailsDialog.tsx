import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Technician } from '@/types/teams';
import { useProducts } from '@/hooks/useProducts';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { useAssetAssignmentHistory, useCreateAssetAssignment, useReturnAsset } from '@/hooks/useAssetAssignments';
import { useAuthContext } from '@/contexts/AuthContext';
import { Plus, HardHat, Shield, Wrench, Phone, Mail, Briefcase, Undo2, Loader2, FileSpreadsheet, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportFichaEPI } from '@/lib/exportFichaEPI';
import { toast } from 'sonner';
import { SignatureModal } from '@/components/ui/signature-modal';

interface ColaboradorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: Technician | null;
}

export function ColaboradorDetailsDialog({ open, onOpenChange, colaborador }: ColaboradorDetailsDialogProps) {
  const { tenant } = useAuthContext();
  const [assigningCategory, setAssigningCategory] = useState<'epi' | 'epc' | 'ferramentas' | null>(null);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [signature, setSignature] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  const { data: epiProducts } = useProducts('epi');
  const { data: epcProducts } = useProducts('epc');
  const { data: ferramentasProducts } = useProducts('ferramentas');
  const { data: serialNumbers } = useSerialNumbers();
  const { data: assignmentHistory, isLoading: loadingHistory } = useAssetAssignmentHistory(colaborador?.id);
  
  const createAssignment = useCreateAssetAssignment();
  const returnAsset = useReturnAsset();

  if (!colaborador) return null;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const activeAssignments = assignmentHistory?.filter(a => !a.returned_at) || [];
  const allAssignments = assignmentHistory || [];

  const availableSerialNumbers = (category: 'epi' | 'epc' | 'ferramentas') => {
    const products = category === 'epi' ? epiProducts : category === 'epc' ? epcProducts : ferramentasProducts;
    const productIds = products?.map(p => p.id) || [];
    return serialNumbers?.filter(sn => 
      sn.status === 'disponivel' && 
      productIds.includes(sn.product_id)
    ) || [];
  };

  const nonSerializedProducts = (category: 'epi' | 'epc' | 'ferramentas') => {
    const products = category === 'epi' ? epiProducts : category === 'epc' ? epcProducts : ferramentasProducts;
    return products?.filter(p => !p.is_serialized && (p.current_stock || 0) > 0) || [];
  };

  const getProductCA = (assignment: any) => {
    if (assignment.serial_number?.product) {
      return (assignment.serial_number.product as any)?.ca_number || '-';
    }
    if (assignment.product) {
      return (assignment.product as any)?.ca_number || '-';
    }
    return '-';
  };

  const handleAssign = async (isSerialized: boolean) => {
    if (!colaborador || !assigningCategory) return;

    if (!signature) {
      toast.error('Assinatura é obrigatória');
      return;
    }

    await createAssignment.mutateAsync({
      technician_id: colaborador.id,
      asset_type: isSerialized ? 'serial_number' : 'product',
      serial_number_id: isSerialized ? selectedSerialNumber : undefined,
      product_id: !isSerialized ? selectedProduct : undefined,
      quantity: !isSerialized ? parseInt(quantity) : 1,
      notes: JSON.stringify({ signature, deliveryNotes: notes }),
      assigned_at: new Date(deliveryDate).toISOString(),
    });

    resetForm();
  };

  const handleReturn = async (assignmentId: string) => {
    if (!returnReason.trim()) {
      toast.error('Informe o motivo da devolução');
      return;
    }
    await returnAsset.mutateAsync({ id: assignmentId, returnReason });
    setReturningId(null);
    setReturnReason('');
  };

  const resetForm = () => {
    setAssigningCategory(null);
    setSelectedSerialNumber('');
    setSelectedProduct('');
    setQuantity('1');
    setNotes('');
    setDeliveryDate(format(new Date(), 'yyyy-MM-dd'));
    setSignature('');
    setShowSignature(false);
  };

  const handleExportFichaEPI = () => {
    if (!colaborador || !tenant) return;

    const epiProductIds = epiProducts?.map(p => p.id) || [];
    const epiAssignmentsForExport = (assignmentHistory || []).filter(a => {
      if (a.product_id && epiProductIds.includes(a.product_id)) return true;
      if (a.serial_number_id) {
        const sn = serialNumbers?.find(s => s.id === a.serial_number_id);
        if (sn && epiProductIds.includes(sn.product_id)) return true;
      }
      return false;
    });

    const epiData = epiAssignmentsForExport.map(a => {
      let description = '';
      let caNumber = '';
      
      if (a.serial_number) {
        description = `${(a.serial_number.product as any)?.name || 'Item'} - ${a.serial_number.serial_number}`;
        caNumber = (a.serial_number.product as any)?.ca_number || '';
      } else if (a.product) {
        description = a.product.name || 'Item';
        caNumber = (a.product as any)?.ca_number || '';
      }

      let parsedNotes: any = {};
      try {
        parsedNotes = a.notes ? JSON.parse(a.notes) : {};
      } catch {}

      return {
        quantity: a.quantity || 1,
        description,
        ca_number: caNumber,
        delivery_date: a.assigned_at || '',
        return_date: a.returned_at || undefined,
        return_reason: parsedNotes.returnReason || '',
        signature: parsedNotes.signature ? 'Sim' : '',
      };
    });

    exportFichaEPI(
      {
        name: tenant.name || 'Empresa',
        address: tenant.address || '',
        city: tenant.city || '',
        state: tenant.state || '',
      },
      {
        name: colaborador.name,
        position: colaborador.position || '',
        hire_date: colaborador.hire_date || '',
      },
      epiData
    );

    toast.success('Ficha de EPI exportada com sucesso!');
  };

  const getCategoryIcon = (category: 'epi' | 'epc' | 'ferramentas') => {
    switch (category) {
      case 'epi': return <HardHat className="h-4 w-4" />;
      case 'epc': return <Shield className="h-4 w-4" />;
      case 'ferramentas': return <Wrench className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: 'epi' | 'epc' | 'ferramentas') => {
    switch (category) {
      case 'epi': return 'EPI';
      case 'epc': return 'EPC';
      case 'ferramentas': return 'Ferramenta';
    }
  };

  const getAssetName = (assignment: any) => {
    if (assignment.serial_number) {
      return `${assignment.serial_number.product?.name || 'Item'}`;
    }
    if (assignment.product) {
      return assignment.product.name;
    }
    return 'Item';
  };

  const AssignmentForm = ({ category }: { category: 'epi' | 'epc' | 'ferramentas' }) => {
    const serialized = availableSerialNumbers(category);
    const nonSerialized = nonSerializedProducts(category);

    const getSelectedProductCA = () => {
      if (selectedSerialNumber) {
        const sn = serialNumbers?.find(s => s.id === selectedSerialNumber);
        return (sn?.product as any)?.ca_number || '-';
      }
      if (selectedProduct) {
        const products = category === 'epi' ? epiProducts : category === 'epc' ? epcProducts : ferramentasProducts;
        const prod = products?.find(p => p.id === selectedProduct);
        return (prod as any)?.ca_number || '-';
      }
      return '-';
    };

    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            {getCategoryIcon(category)}
            Atribuir {getCategoryLabel(category)} - Ficha de Controle
          </h4>
          <Button variant="ghost" size="sm" onClick={resetForm}>Cancelar</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* EPI Selection */}
          <div className="col-span-2 space-y-2">
            <Label>EPI *</Label>
            {serialized.length > 0 && (
              <Select value={selectedSerialNumber} onValueChange={(v) => { setSelectedSerialNumber(v); setSelectedProduct(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione item com número de série" />
                </SelectTrigger>
                <SelectContent>
                  {serialized.map((sn) => (
                    <SelectItem key={sn.id} value={sn.id}>
                      {(sn.product as any)?.name || 'Item'} - {sn.serial_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {nonSerialized.length > 0 && (
              <Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setSelectedSerialNumber(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione item por quantidade" />
                </SelectTrigger>
                <SelectContent>
                  {nonSerialized.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.current_stock} disponíveis)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* N° CA (read-only from product) */}
          <div className="space-y-2">
            <Label>N° CA</Label>
            <Input value={getSelectedProductCA()} readOnly className="bg-muted" />
          </div>

          {/* Data Entrega */}
          <div className="space-y-2">
            <Label>Data Entrega *</Label>
            <Input 
              type="date" 
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>

          {/* Quantidade */}
          {selectedProduct && (
            <div className="space-y-2">
              <Label>Quant. *</Label>
              <Input 
                type="number" 
                min="1" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          )}

          {/* Assinatura */}
          <div className={`space-y-2 ${selectedProduct ? '' : 'col-span-2'}`}>
            <Label>Assinatura *</Label>
            {signature ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-16 border rounded bg-background flex items-center justify-center">
                  <img src={signature} alt="Assinatura" className="max-h-14" />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowSignature(true)}>
                  <PenLine className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full h-16 border-dashed"
                onClick={() => setShowSignature(true)}
              >
                <PenLine className="h-4 w-4 mr-2" />
                Capturar Assinatura
              </Button>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações opcionais..."
            rows={2}
          />
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={() => handleAssign(!!selectedSerialNumber)} 
            disabled={(!selectedSerialNumber && !selectedProduct) || !signature || createAssignment.isPending}
          >
            {createAssignment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Registrar Entrega
          </Button>
        </div>

        <SignatureModal
          open={showSignature}
          onClose={() => setShowSignature(false)}
          onSave={(sig) => setSignature(sig)}
          title="Assinatura do Colaborador"
        />
      </div>
    );
  };

  const AssignmentTable = ({ category }: { category: 'epi' | 'epc' | 'ferramentas' }) => {
    const categoryProducts = category === 'epi' ? epiProducts : category === 'epc' ? epcProducts : ferramentasProducts;
    const productIds = categoryProducts?.map(p => p.id) || [];
    
    // Show all assignments (active and returned) for this category
    const categoryAssignments = allAssignments.filter(a => {
      if (a.product_id && productIds.includes(a.product_id)) return true;
      if (a.serial_number_id) {
        const sn = serialNumbers?.find(s => s.id === a.serial_number_id);
        if (sn && productIds.includes(sn.product_id)) return true;
      }
      return false;
    });

    const parseNotes = (notes: string | null) => {
      try {
        return notes ? JSON.parse(notes) : {};
      } catch {
        return { deliveryNotes: notes };
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            {getCategoryIcon(category)}
            Ficha de {getCategoryLabel(category)}
            <Badge variant="secondary">{categoryAssignments.length}</Badge>
          </h3>
          {assigningCategory !== category && (
            <Button variant="outline" size="sm" onClick={() => setAssigningCategory(category)}>
              <Plus className="h-4 w-4 mr-1" />
              Atribuir {getCategoryLabel(category)}
            </Button>
          )}
        </div>

        {assigningCategory === category && <AssignmentForm category={category} />}

        {categoryAssignments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EPI</TableHead>
                  <TableHead>N° CA</TableHead>
                  <TableHead>Data Entrega</TableHead>
                  <TableHead>Quant.</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead>Data Devolução</TableHead>
                  <TableHead>Motivo Devolução</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryAssignments.map((assignment) => {
                  const parsedNotes = parseNotes(assignment.notes);
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{getAssetName(assignment)}</TableCell>
                      <TableCell>{getProductCA(assignment)}</TableCell>
                      <TableCell>
                        {format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{assignment.quantity || 1}</TableCell>
                      <TableCell>
                        {parsedNotes.signature ? (
                          <img src={parsedNotes.signature} alt="Assinatura" className="h-8 max-w-[60px]" />
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {assignment.returned_at 
                          ? format(new Date(assignment.returned_at), "dd/MM/yyyy", { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {parsedNotes.returnReason || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {!assignment.returned_at && (
                          returningId === assignment.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Motivo..."
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                className="w-28 h-8 text-xs"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReturn(assignment.id)}
                                disabled={returnAsset.isPending}
                              >
                                {returnAsset.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OK'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setReturningId(null); setReturnReason(''); }}
                              >
                                X
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReturningId(assignment.id)}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Devolver
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : !assigningCategory && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum {getCategoryLabel(category).toLowerCase()} registrado
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="text-primary-foreground">Ficha de Controle Individual</DialogTitle>
          <DialogDescription className="text-primary-foreground/80">Gerencie os EPIs e itens sob responsabilidade do colaborador</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Colaborador Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getInitials(colaborador.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold">{colaborador.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {colaborador.position || 'Colaborador'}
                  </p>
                  {colaborador.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {colaborador.phone}
                    </p>
                  )}
                  {colaborador.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {colaborador.email}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <Badge variant="secondary" className="text-lg">
                    {activeAssignments.length} itens
                  </Badge>
                  <p className="text-xs text-muted-foreground">sob responsabilidade</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportFichaEPI}
                    className="gap-1.5"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar Ficha EPI
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs para categorias */}
          <Tabs defaultValue="epi" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="epi" className="flex items-center gap-2">
                <HardHat className="h-4 w-4" />
                EPI
              </TabsTrigger>
              <TabsTrigger value="epc" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                EPC
              </TabsTrigger>
              <TabsTrigger value="ferramentas" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Ferramentas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="epi">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <AssignmentTable category="epi" />
              )}
            </TabsContent>

            <TabsContent value="epc">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <AssignmentTable category="epc" />
              )}
            </TabsContent>

            <TabsContent value="ferramentas">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <AssignmentTable category="ferramentas" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
