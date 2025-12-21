import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Shirt, 
  Plus, 
  Trash2,
  FileSpreadsheet,
  Undo2,
  Wrench,
  Shield
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Employee, EMPLOYEE_STATUS_LABELS, CONTRACT_TYPE_LABELS } from '@/types/hr';
import { useEmployeeEPI } from '@/hooks/useEmployeeEPI';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { exportFichaEPI } from '@/lib/exportFichaEPI';
import { EmployeeFerramentasTab } from './EmployeeFerramentasTab';
import { EmployeeEPCTab } from './EmployeeEPCTab';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export function EmployeeDetailsDialog({ open, onOpenChange, employee }: Props) {
  const { tenant } = useAuth();
  const { updateEmployee } = useEmployees();
  const { assignments, isLoading, createAssignment, updateAssignment, deleteAssignment } = useEmployeeEPI(employee?.id || null);
  const { data: epiProducts = [] } = useProducts('epi');
  
  const [activeTab, setActiveTab] = useState('dados');
  const [sizes, setSizes] = useState({
    blusa_numero: '',
    calca_numero: '',
    calcado_numero: '',
  });
  const [newEPI, setNewEPI] = useState({
    product_id: '',
    description: '',
    ca_number: '',
    quantity: 1,
    size: '',
    delivery_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [showAddEPI, setShowAddEPI] = useState(false);
  const [savingSizes, setSavingSizes] = useState(false);
  const [returnEPI, setReturnEPI] = useState<{ id: string; description: string } | null>(null);
  const [returnData, setReturnData] = useState({
    return_date: format(new Date(), 'yyyy-MM-dd'),
    return_reason: '',
  });

  // Update sizes when employee changes
  useEffect(() => {
    if (employee) {
      setSizes({
        blusa_numero: employee.blusa_numero || '',
        calca_numero: employee.calca_numero || '',
        calcado_numero: employee.calcado_numero || '',
      });
    }
  }, [employee]);

  if (!employee) return null;
  
  const handleSaveSizes = async () => {
    setSavingSizes(true);
    const success = await updateEmployee(employee.id, sizes);
    setSavingSizes(false);
  };

  const handleAddEPI = async () => {
    if (!newEPI.product_id && !newEPI.description.trim()) return;
    
    // Check stock availability if product is selected
    if (newEPI.product_id) {
      const selectedProduct = epiProducts.find(p => p.id === newEPI.product_id);
      if (!selectedProduct) {
        toast.error('Produto não encontrado');
        return;
      }
      
      const currentStock = selectedProduct.current_stock || 0;
      if (currentStock < newEPI.quantity) {
        toast.error(`Estoque insuficiente. Disponível: ${currentStock}`);
        return;
      }
      
      // Decrement stock
      const { error: stockError } = await supabase
        .from('products')
        .update({ current_stock: currentStock - newEPI.quantity })
        .eq('id', newEPI.product_id);
      
      if (stockError) {
        toast.error('Erro ao atualizar estoque');
        console.error('Stock update error:', stockError);
        return;
      }
    }
    
    const created = await createAssignment({
      product_id: newEPI.product_id || undefined,
      description: newEPI.description,
      ca_number: newEPI.ca_number,
      quantity: newEPI.quantity,
      size: newEPI.size,
      delivery_date: newEPI.delivery_date,
    });
    
    if (created) {
      setNewEPI({
        product_id: '',
        description: '',
        ca_number: '',
        quantity: 1,
        size: '',
        delivery_date: format(new Date(), 'yyyy-MM-dd'),
      });
      setShowAddEPI(false);
    }
  };

  const handleEPISelect = (productId: string) => {
    const product = epiProducts.find(p => p.id === productId);
    if (product) {
      setNewEPI({
        ...newEPI,
        product_id: productId,
        description: product.name,
        ca_number: product.ca_number || '',
        size: product.size || '',
      });
    }
  };

  const handleReturnEPI = async () => {
    if (!returnEPI) return;
    
    const success = await updateAssignment(returnEPI.id, {
      return_date: returnData.return_date,
      return_reason: returnData.return_reason,
    });
    
    if (success) {
      setReturnEPI(null);
      setReturnData({
        return_date: format(new Date(), 'yyyy-MM-dd'),
        return_reason: '',
      });
    }
  };

  const openReturnDialog = (epi: { id: string; description: string }) => {
    setReturnEPI(epi);
    setReturnData({
      return_date: format(new Date(), 'yyyy-MM-dd'),
      return_reason: '',
    });
  };

  const handleExportExcel = () => {
    if (!tenant) return;
    
    exportFichaEPI(
      {
        name: tenant.name,
        address: (tenant as any).address,
        city: (tenant as any).city,
        state: (tenant as any).state,
        logo_url: tenant.logo_url || undefined,
      },
      {
        name: employee.name,
        position: employee.position,
        hire_date: employee.hire_date,
        termination_date: employee.termination_date,
      },
      assignments.map(a => ({
        quantity: a.quantity,
        description: a.description,
        ca_number: a.ca_number,
        delivery_date: a.delivery_date,
        return_date: a.return_date,
        return_reason: a.return_reason,
      })),
      {
        blusa: sizes.blusa_numero || employee.blusa_numero,
        calca: sizes.calca_numero || employee.calca_numero,
        calcado: sizes.calcado_numero || employee.calcado_numero,
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500/10 text-green-500';
      case 'ferias': return 'bg-blue-500/10 text-blue-500';
      case 'afastado': return 'bg-yellow-500/10 text-yellow-500';
      case 'desligado': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="bg-primary px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {employee.photo_url ? (
                <img 
                  src={employee.photo_url} 
                  alt={employee.name}
                  className="h-14 w-14 rounded-full object-cover border-2 border-primary-foreground/20"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary-foreground" />
                </div>
              )}
              <div>
                <DialogTitle className="text-primary-foreground text-lg">{employee.name}</DialogTitle>
                <p className="text-primary-foreground/70 text-sm">{employee.position || 'Sem cargo'}</p>
              </div>
            </div>
            <Badge className={getStatusColor(employee.status)}>
              {EMPLOYEE_STATUS_LABELS[employee.status]}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-4 shrink-0 rounded-none border-b">
            <TabsTrigger value="dados" className="gap-1 rounded-none text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="epi" className="gap-1 rounded-none text-xs sm:text-sm">
              <Shirt className="h-4 w-4" />
              <span className="hidden sm:inline">EPI</span>
            </TabsTrigger>
            <TabsTrigger value="ferramentas" className="gap-1 rounded-none text-xs sm:text-sm">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Ferramentas</span>
            </TabsTrigger>
            <TabsTrigger value="epc" className="gap-1 rounded-none text-xs sm:text-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">EPC</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">

          <TabsContent value="dados" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPF:</span>
                    <span>{employee.cpf || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RG:</span>
                    <span>{employee.rg || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nascimento:</span>
                    <span>{employee.birth_date ? format(new Date(employee.birth_date), 'dd/MM/yyyy') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{employee.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span>{employee.phone || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Informações Profissionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matrícula:</span>
                    <span>{employee.registration_number || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departamento:</span>
                    <span>{employee.department || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contrato:</span>
                    <Badge variant="outline">{CONTRACT_TYPE_LABELS[employee.contract_type]}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admissão:</span>
                    <span>{employee.hire_date ? format(new Date(employee.hire_date), 'dd/MM/yyyy') : '-'}</span>
                  </div>
                  {employee.termination_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desligamento:</span>
                      <span>{format(new Date(employee.termination_date), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {employee.address && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>
                    {employee.address}
                    {employee.number && `, ${employee.number}`}
                    {employee.complement && ` - ${employee.complement}`}
                  </p>
                  <p>
                    {employee.neighborhood}
                    {employee.city && ` - ${employee.city}`}
                    {employee.state && `/${employee.state}`}
                    {employee.zip_code && ` - CEP: ${employee.zip_code}`}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="epi" className="space-y-4 mt-0">
            {/* Uniform Sizes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shirt className="h-4 w-4" />
                  Tamanhos de Uniforme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="blusa">Blusa Nº</Label>
                    <Input
                      id="blusa"
                      value={sizes.blusa_numero}
                      onChange={(e) => setSizes({ ...sizes, blusa_numero: e.target.value })}
                      placeholder="Ex: M, G, GG"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calca">Calça Nº</Label>
                    <Input
                      id="calca"
                      value={sizes.calca_numero}
                      onChange={(e) => setSizes({ ...sizes, calca_numero: e.target.value })}
                      placeholder="Ex: 40, 42, 44"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calcado">Calçado Nº</Label>
                    <Input
                      id="calcado"
                      value={sizes.calcado_numero}
                      onChange={(e) => setSizes({ ...sizes, calcado_numero: e.target.value })}
                      placeholder="Ex: 38, 40, 42"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveSizes} size="sm" className="mt-3" disabled={savingSizes}>
                  {savingSizes ? 'Salvando...' : 'Salvar Tamanhos'}
                </Button>
              </CardContent>
            </Card>

            {/* EPI List */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Ficha de Controle de EPI</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Exportar Excel
                  </Button>
                  <Button size="sm" onClick={() => setShowAddEPI(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar EPI
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddEPI && (
                  <div className="border rounded-lg p-4 mb-4 bg-muted/30">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="sm:col-span-2">
                        <Label>EPI do Estoque *</Label>
                        <Select value={newEPI.product_id} onValueChange={handleEPISelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o EPI" />
                          </SelectTrigger>
                          <SelectContent>
                            {epiProducts.map((product) => (
                              <SelectItem 
                                key={product.id} 
                                value={product.id}
                                disabled={(product.current_stock || 0) === 0}
                              >
                                {product.name} {product.ca_number ? `(CA: ${product.ca_number})` : ''} - Estoque: {product.current_stock || 0}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Nº CA</Label>
                        <Input
                          value={newEPI.ca_number}
                          onChange={(e) => setNewEPI({ ...newEPI, ca_number: e.target.value })}
                          placeholder="Ex: 12345"
                          readOnly
                        />
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newEPI.quantity}
                          onChange={(e) => setNewEPI({ ...newEPI, quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label>Tamanho</Label>
                        <Input
                          value={newEPI.size}
                          onChange={(e) => setNewEPI({ ...newEPI, size: e.target.value })}
                          placeholder="Ex: M"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={handleAddEPI} disabled={!newEPI.product_id}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddEPI(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum EPI registrado
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quant.</TableHead>
                          <TableHead>Descrição do EPI</TableHead>
                          <TableHead>Nº CA</TableHead>
                          <TableHead>Tamanho</TableHead>
                          <TableHead>Entrega</TableHead>
                          <TableHead>Devolução</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((epi) => (
                          <TableRow key={epi.id}>
                            <TableCell>{epi.quantity}</TableCell>
                            <TableCell className="font-medium">{epi.description}</TableCell>
                            <TableCell>{epi.ca_number || '-'}</TableCell>
                            <TableCell>{epi.size || '-'}</TableCell>
                            <TableCell>
                              {format(new Date(epi.delivery_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {epi.return_date 
                                ? format(new Date(epi.return_date), 'dd/MM/yyyy', { locale: ptBR })
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {!epi.return_date && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openReturnDialog({ id: epi.id, description: epi.description })}
                                    title="Registrar devolução"
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteAssignment(epi.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ferramentas" className="space-y-4 mt-0">
            <EmployeeFerramentasTab
              employeeId={employee.id}
              employeeName={employee.name}
              employeePosition={employee.position}
              employeeHireDate={employee.hire_date}
              employeeTerminationDate={employee.termination_date}
              employeeDepartment={employee.department}
            />
          </TabsContent>

          <TabsContent value="epc" className="space-y-4 mt-0">
            <EmployeeEPCTab
              employeeId={employee.id}
              employeeName={employee.name}
              employeePosition={employee.position}
              employeeHireDate={employee.hire_date}
              employeeTerminationDate={employee.termination_date}
              employeeDepartment={employee.department}
            />
          </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Return EPI Dialog */}
    <Dialog open={!!returnEPI} onOpenChange={(open) => !open && setReturnEPI(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Devolução</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            EPI: <span className="font-medium text-foreground">{returnEPI?.description}</span>
          </p>
          <div>
            <Label>Data de Devolução</Label>
            <Input
              type="date"
              value={returnData.return_date}
              onChange={(e) => setReturnData({ ...returnData, return_date: e.target.value })}
            />
          </div>
          <div>
            <Label>Motivo da Devolução</Label>
            <Textarea
              value={returnData.return_reason}
              onChange={(e) => setReturnData({ ...returnData, return_reason: e.target.value })}
              placeholder="Ex: Desgaste, troca de tamanho, fim de uso..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setReturnEPI(null)}>
              Cancelar
            </Button>
            <Button onClick={handleReturnEPI}>
              Confirmar Devolução
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
