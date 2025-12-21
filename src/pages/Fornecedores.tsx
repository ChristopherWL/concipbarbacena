import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/hooks/useSuppliers';
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  Trash2,
  User
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { Supplier } from '@/types/stock';
import { formatCNPJ, formatPhone } from '@/lib/formatters';

interface SupplierFormData {
  name: string;
  cnpj: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  notes: string;
}

const initialFormData: SupplierFormData = {
  name: '',
  cnpj: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  notes: '',
};

export default function Fornecedores() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const { isReadOnly } = useDirectorBranch();
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name || '',
        cnpj: editingSupplier.cnpj || '',
        contact_name: editingSupplier.contact_name || '',
        phone: editingSupplier.phone || '',
        email: editingSupplier.email || '',
        address: editingSupplier.address || '',
        city: editingSupplier.city || '',
        state: editingSupplier.state || '',
        notes: editingSupplier.notes || '',
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingSupplier]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Informe o nome do fornecedor');
      return;
    }

    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          id: editingSupplier.id,
          ...formData,
        });
      } else {
        await createSupplier.mutateAsync({
          ...formData,
          is_active: true,
        });
      }
      setShowForm(false);
      setEditingSupplier(null);
      setFormData(initialFormData);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteSupplier.mutateAsync(deleteConfirm);
      setDeleteConfirm(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const activeSuppliers = suppliers.filter(s => s.is_active !== false);
  const filteredSuppliers = activeSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.cnpj?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return <PageLoading text="Carregando fornecedores" />;
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-4">
        <PageHeader
          title="Fornecedores"
          description="Gerencie os fornecedores da sua empresa"
        />

        {/* Actions */}
        <Card className="overflow-hidden bg-transparent sm:bg-card border-0 sm:border shadow-none sm:shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou contato..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {!isReadOnly && (
                <Button 
                  onClick={() => {
                    setEditingSupplier(null);
                    setShowForm(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Novo Fornecedor
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {!searchQuery && 'Clique em "Novo Fornecedor" para começar'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3 p-3">
                  {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-card rounded-lg border p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            {supplier.cnpj && (
                              <Badge variant="outline" className="font-mono text-xs mt-1">
                                {supplier.cnpj}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!isReadOnly && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingSupplier(supplier);
                                setShowForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10"
                              onClick={() => setDeleteConfirm(supplier.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {supplier.contact_name && (
                          <p className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {supplier.contact_name}
                          </p>
                        )}
                        {supplier.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {supplier.phone}
                          </p>
                        )}
                        {supplier.email && (
                          <p className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {supplier.email}
                          </p>
                        )}
                        {supplier.city && supplier.state && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {supplier.city}/{supplier.state}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="hidden lg:table-cell">CNPJ</TableHead>
                        <TableHead className="hidden xl:table-cell">Contato</TableHead>
                        <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                        <TableHead className="hidden xl:table-cell">Cidade/UF</TableHead>
                        {!isReadOnly && <TableHead className="w-20"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id} className="hover:bg-muted/30">
                          <TableCell className="py-2">
                            <div>
                              <p className="font-medium text-sm">{supplier.name}</p>
                              <p className="text-xs text-muted-foreground lg:hidden">{supplier.cnpj || '-'}</p>
                              {supplier.email && (
                                <p className="text-xs text-muted-foreground">{supplier.email}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {supplier.cnpj ? (
                              <Badge variant="outline" className="font-mono text-xs">
                                {supplier.cnpj}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm">
                            {supplier.contact_name || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {supplier.phone || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm">
                            {supplier.city && supplier.state ? (
                              `${supplier.city}/${supplier.state}`
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          {!isReadOnly && (
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingSupplier(supplier);
                                    setShowForm(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-destructive/10"
                                  onClick={() => setDeleteConfirm(supplier.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="flex items-center gap-2 text-primary-foreground">
                <Building2 className="h-5 w-5" />
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome / Razão Social <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Nome da empresa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    maxLength={18}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pessoa de Contato</Label>
                  <Input
                    placeholder="Nome do contato principal"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  placeholder="Rua, número, bairro"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    placeholder="Cidade"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Informações adicionais sobre o fornecedor..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createSupplier.isPending || updateSupplier.isPending}
                className="gap-2"
              >
                {(createSupplier.isPending || updateSupplier.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {editingSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Fornecedor</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este fornecedor? Esta ação pode ser desfeita pelo suporte.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
