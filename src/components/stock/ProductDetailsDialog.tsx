import { useState } from 'react';
import { Product, SerialNumber, CATEGORY_LABELS, StockCategory, SERIAL_STATUS_LABELS, SerialStatus } from '@/types/stock';
import { useSerialNumbers, useUpdateSerialStatus } from '@/hooks/useSerialNumbers';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useStockAudits } from '@/hooks/useStockAudits';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, Barcode, ArrowUpCircle, ArrowDownCircle, 
  ClipboardCheck, Loader2, AlertCircle, CheckCircle2,
  Shield, ShieldCheck, ShieldAlert, Clock, AlertOctagon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_COLORS: Record<SerialStatus, string> = {
  disponivel: 'bg-success text-success-foreground',
  em_uso: 'bg-info text-info-foreground',
  em_manutencao: 'bg-warning text-warning-foreground',
  descartado: 'bg-destructive text-destructive-foreground',
};

export function ProductDetailsDialog({ product, open, onOpenChange }: ProductDetailsDialogProps) {
  const { data: serialNumbers = [], isLoading: serialsLoading } = useSerialNumbers(product?.id);
  const { data: movements = [], isLoading: movementsLoading } = useStockMovements(product?.id);
  const { data: warrantyAudits = [] } = useStockAudits({ 
    audit_type: 'garantia', 
    product_id: product?.id 
  });
  const { data: theftAudits = [] } = useStockAudits({ 
    audit_type: 'furto', 
    product_id: product?.id 
  });
  const updateSerialStatus = useUpdateSerialStatus();
  
  const [auditMode, setAuditMode] = useState(false);
  const [auditCount, setAuditCount] = useState('');
  const [auditNotes, setAuditNotes] = useState('');

  if (!product) return null;

  // Calculate warranty stats
  const warrantyStats = {
    inWarranty: warrantyAudits.filter(a => a.status === 'aberto' || a.status === 'em_analise').length,
    sentToWarranty: warrantyAudits.filter(a => a.status === 'enviado').length,
    returnedFromWarranty: warrantyAudits.filter(a => a.status === 'recebido' || a.status === 'resolvido').length,
  };

  // Calculate theft stats
  const theftStats = {
    pending: theftAudits.filter(a => a.status === 'aberto' || a.status === 'em_analise').length,
    resolved: theftAudits.filter(a => a.status === 'resolvido').length,
    total: theftAudits.reduce((acc, a) => acc + a.quantity, 0),
  };

  const showWarrantySection = product.category === 'materiais' || product.category === 'equipamentos';

  if (!product) return null;

  const handleAudit = () => {
    const counted = parseInt(auditCount);
    if (isNaN(counted) || counted < 0) {
      toast.error('Quantidade inválida');
      return;
    }
    
    const difference = counted - product.current_stock;
    if (difference === 0) {
      toast.success('Estoque conferido! Sem divergências.');
    } else if (difference > 0) {
      toast.info(`Divergência encontrada: +${difference} itens a mais que o registrado`);
    } else {
      toast.warning(`Divergência encontrada: ${difference} itens a menos que o registrado`);
    }
    
    setAuditMode(false);
    setAuditCount('');
    setAuditNotes('');
  };

  const handleStatusChange = async (serialId: string, newStatus: SerialStatus) => {
    await updateSerialStatus.mutateAsync({ id: serialId, status: newStatus });
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return <ArrowDownCircle className="h-4 w-4 text-success" />;
      case 'saida':
        return <ArrowUpCircle className="h-4 w-4 text-destructive" />;
      case 'devolucao':
        return <ArrowDownCircle className="h-4 w-4 text-info" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] w-[95vw] p-0 overflow-hidden bg-transparent shadow-none border-0 [&>button]:hidden">
        <div className="bg-background rounded-xl overflow-hidden shadow-2xl">
        <DialogHeader className="bg-primary px-3 py-2.5">
          <DialogTitle className="flex items-center text-primary-foreground text-sm">
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground text-[10px] px-1.5 flex-shrink-0">{product.code}</Badge>
            <span className="truncate flex-1 text-center">{product.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-3">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className={`grid w-full h-8 ${showWarrantySection ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="details" className="text-[10px] py-1">Detalhes</TabsTrigger>
              <TabsTrigger value="movements" className="text-[10px] py-1">Movim.</TabsTrigger>
              {showWarrantySection && (
                <TabsTrigger value="warranty" className="text-[10px] py-1">Garantia</TabsTrigger>
              )}
              <TabsTrigger value="theft" className="text-[10px] py-1">Furtos</TabsTrigger>
            </TabsList>

          <TabsContent value="details" className="space-y-2 max-h-[55vh] overflow-y-auto mt-2">
            <div className="grid grid-cols-4 gap-2">
              <Card>
                <CardContent className="p-2 flex flex-col items-center justify-center h-14">
                  <p className="text-base font-bold text-primary leading-none">{product.current_stock}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">Atual</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 flex flex-col items-center justify-center h-14">
                  <p className="text-base font-bold leading-none">{product.min_stock}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">Mínimo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 flex flex-col items-center justify-center h-14">
                  <p className="text-sm font-bold leading-none">R${product.cost_price.toFixed(0)}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">Custo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 flex flex-col items-center justify-center h-14">
                  <Badge variant="outline" className="text-[8px] px-1">{CATEGORY_LABELS[product.category as StockCategory]}</Badge>
                  <p className="text-[9px] text-muted-foreground mt-1">Categ.</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-4 text-xs">
              <span><span className="text-muted-foreground">Un:</span> {product.unit}</span>
              <span><span className="text-muted-foreground">Serial:</span> {product.is_serialized ? 'Sim' : 'Não'}</span>
            </div>

            {/* Audit Section */}
            <Card className="border-dashed">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs flex items-center gap-2">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Auditoria de Inventário
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
                {!auditMode ? (
                  <Button onClick={() => setAuditMode(true)} variant="outline" size="sm" className="w-full text-xs h-8">
                    <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                    Iniciar Contagem
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                      <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                      <span>Estoque: <strong>{product.current_stock}</strong> {product.unit}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Qtd Contada</Label>
                        <Input 
                          type="number" 
                          value={auditCount} 
                          onChange={(e) => setAuditCount(e.target.value)}
                          placeholder="0"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Obs</Label>
                        <Input 
                          value={auditNotes} 
                          onChange={(e) => setAuditNotes(e.target.value)}
                          placeholder="..."
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAudit} size="sm" className="flex-1 h-8 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Confirmar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAuditMode(false)} className="h-8 text-xs">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {product.is_serialized && (
            <TabsContent value="serials">
              <ScrollArea className="h-[400px]">
                {serialsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : serialNumbers.length === 0 ? (
                  <div className="text-center py-8">
                    <Barcode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum número de série cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número de Série</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serialNumbers.map((serial) => (
                        <TableRow key={serial.id}>
                          <TableCell className="font-mono">{serial.serial_number}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[serial.status]}>
                              {SERIAL_STATUS_LABELS[serial.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>{serial.location || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(serial.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={serial.status} 
                              onValueChange={(v) => handleStatusChange(serial.id, v as SerialStatus)}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="disponivel">Disponível</SelectItem>
                                <SelectItem value="em_uso">Em Uso</SelectItem>
                                <SelectItem value="em_manutencao">Manutenção</SelectItem>
                                <SelectItem value="descartado">Descartado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>
          )}

          <TabsContent value="movements" className="mt-2">
            <ScrollArea className="h-[280px]">
              {movementsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-6">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">Nenhuma movimentação</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {movements.map((mov) => (
                    <div key={mov.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(mov.movement_type)}
                        <div>
                          <p className="font-medium capitalize">{mov.movement_type}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(mov.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${mov.movement_type === 'entrada' || mov.movement_type === 'devolucao' ? 'text-success' : 'text-destructive'}`}>
                          {mov.movement_type === 'entrada' || mov.movement_type === 'devolucao' ? '+' : '-'}{mov.quantity}
                        </p>
                        {mov.reason && <p className="text-[9px] text-muted-foreground truncate max-w-[80px]">{mov.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Warranty Tab */}
          {showWarrantySection && (
            <TabsContent value="warranty" className="space-y-2 max-h-[55vh] overflow-y-auto mt-2">
              {/* Stats Cards - Compact */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="p-2 flex flex-col items-center justify-center h-16">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <p className="text-base font-bold text-amber-600 leading-none mt-1">{warrantyStats.inWarranty}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Em Análise</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardContent className="p-2 flex flex-col items-center justify-center h-16">
                    <ShieldAlert className="h-4 w-4 text-blue-600" />
                    <p className="text-base font-bold text-blue-600 leading-none mt-1">{warrantyStats.sentToWarranty}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Enviados</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-2 flex flex-col items-center justify-center h-16">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <p className="text-base font-bold text-emerald-600 leading-none mt-1">{warrantyStats.returnedFromWarranty}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Retornados</p>
                  </CardContent>
                </Card>
              </div>

              {/* Warranty History */}
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    Histórico de Garantia
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <ScrollArea className="h-[200px]">
                    {warrantyAudits.length === 0 ? (
                      <div className="text-center py-6">
                        <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-xs">Nenhum registro de garantia</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {warrantyAudits.map((audit) => (
                          <div key={audit.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{format(new Date(audit.reported_at), 'dd/MM/yy', { locale: ptBR })}</span>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                                audit.status === 'enviado' ? 'border-blue-500 text-blue-600' :
                                audit.status === 'recebido' || audit.status === 'resolvido' ? 'border-emerald-500 text-emerald-600' :
                                'border-amber-500 text-amber-600'
                              }`}>
                                {audit.status === 'aberto' ? 'Aberto' : audit.status === 'em_analise' ? 'Análise' : audit.status === 'enviado' ? 'Enviado' : audit.status === 'recebido' ? 'Recebido' : audit.status === 'resolvido' ? 'Resolvido' : 'Cancelado'}
                              </Badge>
                            </div>
                            <span className="font-medium">{audit.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Theft Tab */}
          <TabsContent value="theft" className="space-y-2 max-h-[55vh] overflow-y-auto mt-2">
            {/* Stats Cards - Compact */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-2 flex flex-col items-center justify-center h-16">
                  <AlertOctagon className="h-4 w-4 text-red-600" />
                  <p className="text-base font-bold text-red-600 leading-none mt-1">{theftStats.total}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Total</p>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-2 flex flex-col items-center justify-center h-16">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <p className="text-base font-bold text-amber-600 leading-none mt-1">{theftStats.pending}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Pendentes</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-2 flex flex-col items-center justify-center h-16">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-base font-bold text-emerald-600 leading-none mt-1">{theftStats.resolved}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Resolvidos</p>
                </CardContent>
              </Card>
            </div>

            {/* Theft History */}
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs flex items-center gap-2">
                  <AlertOctagon className="h-3.5 w-3.5 text-destructive" />
                  Histórico de Furtos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
                <ScrollArea className="h-[200px]">
                  {theftAudits.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertOctagon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-xs">Nenhum registro de furto</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {theftAudits.map((audit) => (
                        <div key={audit.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{format(new Date(audit.reported_at), 'dd/MM/yy', { locale: ptBR })}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                              audit.status === 'resolvido' ? 'border-emerald-500 text-emerald-600' :
                              audit.status === 'cancelado' ? 'border-muted text-muted-foreground' :
                              'border-red-500 text-red-600'
                            }`}>
                              {audit.status === 'aberto' ? 'Aberto' : audit.status === 'em_analise' ? 'Análise' : audit.status === 'resolvido' ? 'Resolvido' : 'Cancelado'}
                            </Badge>
                          </div>
                          <span className="font-medium text-destructive">{audit.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}