import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Undo2, FileText, Search, Truck, Package, Barcode, Loader2 } from 'lucide-react';
import { useAssetAssignments, useAssetAssignmentHistory, useCreateAssetAssignment, useReturnAsset } from '@/hooks/useAssetAssignments';
import { useTechnicians } from '@/hooks/useTeams';
import { useVehicles } from '@/hooks/useFleet';
import { useProducts } from '@/hooks/useProducts';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Cautelas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetType, setAssetType] = useState<'vehicle' | 'product' | 'serial_number'>('serial_number');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSerialNumber, setSelectedSerialNumber] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [notes, setNotes] = useState('');

  const { data: activeAssignments, isLoading: loadingActive } = useAssetAssignments();
  const { data: allAssignments, isLoading: loadingHistory } = useAssetAssignmentHistory();
  const { data: technicians } = useTechnicians();
  const { data: vehicles } = useVehicles();
  const { data: products } = useProducts();
  const { data: serialNumbers } = useSerialNumbers();

  const createAssignment = useCreateAssetAssignment();
  const returnAsset = useReturnAsset();

  const availableSerialNumbers = serialNumbers?.filter(sn => sn.status === 'disponivel');

  const handleCreateAssignment = async () => {
    if (!selectedTechnician) return;

    await createAssignment.mutateAsync({
      technician_id: selectedTechnician,
      asset_type: assetType,
      vehicle_id: assetType === 'vehicle' ? selectedVehicle : undefined,
      product_id: assetType === 'product' ? selectedProduct : undefined,
      serial_number_id: assetType === 'serial_number' ? selectedSerialNumber : undefined,
      quantity: assetType === 'product' ? parseInt(quantity) : 1,
      expected_return: expectedReturn || undefined,
      notes: notes || undefined,
    });

    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedTechnician('');
    setSelectedVehicle('');
    setSelectedProduct('');
    setSelectedSerialNumber('');
    setQuantity('1');
    setExpectedReturn('');
    setNotes('');
    setAssetType('serial_number');
  };

  const handleReturn = async (assignmentId: string) => {
    await returnAsset.mutateAsync(assignmentId);
  };

  const getAssetName = (assignment: any) => {
    if (assignment.vehicle) {
      return `${assignment.vehicle.brand} ${assignment.vehicle.model} - ${assignment.vehicle.plate}`;
    }
    if (assignment.serial_number) {
      return `${assignment.serial_number.product?.name || 'Item'} - ${assignment.serial_number.serial_number}`;
    }
    if (assignment.product) {
      return `${assignment.product.name} (${assignment.quantity || 1}x)`;
    }
    return 'Item';
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'vehicle':
        return <Truck className="h-4 w-4" />;
      case 'serial_number':
        return <Barcode className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const filteredActive = activeAssignments?.filter(a => 
    a.technician?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getAssetName(a).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = allAssignments?.filter(a => 
    a.technician?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getAssetName(a).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Cautelas" 
          description="Controle de atribuição de ativos aos colaboradores"
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Cautela
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
                <DialogTitle className="text-primary-foreground">Nova Cautela</DialogTitle>
                <DialogDescription className="text-primary-foreground/80">Atribuir ativo a um colaborador</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Colaborador *</Label>
                  <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians?.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Ativo *</Label>
                  <Select value={assetType} onValueChange={(v) => setAssetType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serial_number">Item com Número de Série</SelectItem>
                      <SelectItem value="vehicle">Veículo</SelectItem>
                      <SelectItem value="product">Produto (quantidade)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {assetType === 'vehicle' && (
                  <div className="space-y-2">
                    <Label>Veículo *</Label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles?.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.brand} {v.model} - {v.plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {assetType === 'serial_number' && (
                  <div className="space-y-2">
                    <Label>Item com Número de Série *</Label>
                    <Select value={selectedSerialNumber} onValueChange={setSelectedSerialNumber}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o item" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSerialNumbers?.map((sn) => (
                          <SelectItem key={sn.id} value={sn.id}>
                            {(sn.product as any)?.name || 'Item'} - {sn.serial_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {assetType === 'product' && (
                  <>
                    <div className="space-y-2">
                      <Label>Produto *</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.filter(p => !p.is_serialized).map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.current_stock} disponíveis)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Previsão de Devolução</Label>
                  <Input
                    type="date"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateAssignment}
                  disabled={!selectedTechnician || createAssignment.isPending}
                >
                  {createAssignment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Cautela
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador ou item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Ativos ({filteredActive?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Cautelas Ativas - Colaboradores
                </CardTitle>
                <CardDescription>Itens atualmente sob responsabilidade de colaboradores</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActive ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredActive?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma cautela ativa encontrada
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Data Atribuição</TableHead>
                        <TableHead>Prev. Devolução</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActive?.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              {getAssetIcon(assignment.asset_type)}
                              {assignment.asset_type === 'vehicle' ? 'Veículo' : 
                               assignment.asset_type === 'serial_number' ? 'Serializado' : 'Produto'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{getAssetName(assignment)}</TableCell>
                          <TableCell>{assignment.technician?.name}</TableCell>
                          <TableCell>
                            {format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {assignment.expected_return 
                              ? format(new Date(assignment.expected_return), "dd/MM/yyyy", { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReturn(assignment.id)}
                              disabled={returnAsset.isPending}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Devolver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Cautelas</CardTitle>
                <CardDescription>Todas as atribuições realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredHistory?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum histórico encontrado
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Atribuído em</TableHead>
                        <TableHead>Devolvido em</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory?.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              {getAssetIcon(assignment.asset_type)}
                              {assignment.asset_type === 'vehicle' ? 'Veículo' : 
                               assignment.asset_type === 'serial_number' ? 'Serializado' : 'Produto'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{getAssetName(assignment)}</TableCell>
                          <TableCell>{assignment.technician?.name}</TableCell>
                          <TableCell>
                            {format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {assignment.returned_at 
                              ? format(new Date(assignment.returned_at), "dd/MM/yyyy", { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={assignment.returned_at ? 'secondary' : 'default'}>
                              {assignment.returned_at ? 'Devolvido' : 'Em uso'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
