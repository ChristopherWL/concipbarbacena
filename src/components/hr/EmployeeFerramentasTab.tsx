import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, FileSpreadsheet, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmployeeFerramentas } from '@/hooks/useEmployeeFerramentas';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportFichaFerramentas } from '@/lib/exportFichaFerramentas';

interface Props {
  employeeId: string;
  employeeName: string;
  employeePosition?: string;
  employeeHireDate?: string;
  employeeTerminationDate?: string;
  employeeDepartment?: string;
}

export function EmployeeFerramentasTab({
  employeeId,
  employeeName,
  employeePosition,
  employeeHireDate,
  employeeTerminationDate,
  employeeDepartment,
}: Props) {
  const { tenant } = useAuth();
  const { assignments, isLoading, createAssignment, updateAssignment, deleteAssignment } = useEmployeeFerramentas(employeeId);
  const { data: ferramentasProducts = [] } = useProducts('ferramentas');

  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    product_id: '',
    description: '',
    serial_number: '',
    quantity: 1,
    delivery_date: format(new Date(), 'yyyy-MM-dd'),
    condition_delivery: 'novo',
  });
  const [returnItem, setReturnItem] = useState<{ id: string; description: string } | null>(null);
  const [returnData, setReturnData] = useState({
    return_date: format(new Date(), 'yyyy-MM-dd'),
    return_reason: '',
    condition_return: '',
  });

  const handleProductSelect = (productId: string) => {
    const product = ferramentasProducts.find(p => p.id === productId);
    if (product) {
      setNewItem({
        ...newItem,
        product_id: productId,
        description: product.name,
      });
    }
  };

  const handleAdd = async () => {
    if (!newItem.product_id && !newItem.description.trim()) return;

    if (newItem.product_id) {
      const selectedProduct = ferramentasProducts.find(p => p.id === newItem.product_id);
      if (!selectedProduct) {
        toast.error('Produto não encontrado');
        return;
      }

      const currentStock = selectedProduct.current_stock || 0;
      if (currentStock < newItem.quantity) {
        toast.error(`Estoque insuficiente. Disponível: ${currentStock}`);
        return;
      }

      const { error: stockError } = await supabase
        .from('products')
        .update({ current_stock: currentStock - newItem.quantity })
        .eq('id', newItem.product_id);

      if (stockError) {
        toast.error('Erro ao atualizar estoque');
        return;
      }
    }

    await createAssignment({
      product_id: newItem.product_id || undefined,
      description: newItem.description,
      serial_number: newItem.serial_number,
      quantity: newItem.quantity,
      delivery_date: newItem.delivery_date,
      condition_delivery: newItem.condition_delivery,
    });

    setNewItem({
      product_id: '',
      description: '',
      serial_number: '',
      quantity: 1,
      delivery_date: format(new Date(), 'yyyy-MM-dd'),
      condition_delivery: 'novo',
    });
    setShowAdd(false);
  };

  const handleReturn = async () => {
    if (!returnItem) return;

    await updateAssignment(returnItem.id, {
      return_date: returnData.return_date,
      return_reason: returnData.return_reason,
      condition_return: returnData.condition_return,
    });

    setReturnItem(null);
    setReturnData({
      return_date: format(new Date(), 'yyyy-MM-dd'),
      return_reason: '',
      condition_return: '',
    });
  };

  const handleExport = () => {
    if (!tenant) return;

    exportFichaFerramentas(
      {
        name: tenant.name,
        address: (tenant as any).address,
        city: (tenant as any).city,
        state: (tenant as any).state,
      },
      {
        name: employeeName,
        position: employeePosition,
        hire_date: employeeHireDate,
        termination_date: employeeTerminationDate,
        department: employeeDepartment,
      },
      assignments.map(a => ({
        quantity: a.quantity,
        description: a.description,
        serial_number: a.serial_number,
        delivery_date: a.delivery_date,
        return_date: a.return_date,
        return_reason: a.return_reason,
        condition_delivery: a.condition_delivery,
        condition_return: a.condition_return,
      }))
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Ficha de Controle de Ferramentas</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Exportar Excel
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAdd && (
            <div className="border rounded-lg p-4 mb-4 bg-muted/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <Label>Ferramenta do Estoque</Label>
                  <Select value={newItem.product_id} onValueChange={handleProductSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ferramentasProducts.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id}
                          disabled={(product.current_stock || 0) === 0}
                        >
                          {product.name} - Estoque: {product.current_stock || 0}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nº Série</Label>
                  <Input
                    value={newItem.serial_number}
                    onChange={(e) => setNewItem({ ...newItem, serial_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleAdd} disabled={!newItem.product_id}>
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma ferramenta registrada
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quant.</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Nº Série</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Devolução</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>{item.serial_number || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(item.delivery_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {item.return_date
                          ? format(new Date(item.return_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!item.return_date && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setReturnItem({ id: item.id, description: item.description })}
                              title="Registrar devolução"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAssignment(item.id)}
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

      <Dialog open={!!returnItem} onOpenChange={(open) => !open && setReturnItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Devolução</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ferramenta: <span className="font-medium text-foreground">{returnItem?.description}</span>
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
              <Label>Condição</Label>
              <Select value={returnData.condition_return} onValueChange={(v) => setReturnData({ ...returnData, condition_return: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bom">Bom estado</SelectItem>
                  <SelectItem value="desgastado">Desgastado</SelectItem>
                  <SelectItem value="danificado">Danificado</SelectItem>
                  <SelectItem value="inutilizavel">Inutilizável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea
                value={returnData.return_reason}
                onChange={(e) => setReturnData({ ...returnData, return_reason: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReturnItem(null)}>
                Cancelar
              </Button>
              <Button onClick={handleReturn}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
