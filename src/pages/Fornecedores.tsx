import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  User,
  Zap,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';
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

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedSuppliers,
    totalItems,
  } = usePagination(filteredSuppliers, 10);

  if (authLoading) {
    return <PageLoading text="Carregando fornecedores" />;
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="min-h-screen relative">
        {/* Futuristic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-info/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto space-y-8 p-4 sm:p-6">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-info p-8 sm:p-12 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Fornecedores</h1>
                    <p className="text-white/70 mt-1">Gerencie sua rede de parceiros</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <p className="text-3xl font-bold">{activeSuppliers.length}</p>
                  <p className="text-xs text-white/70 uppercase tracking-wider">Total</p>
                </div>
                {!isReadOnly && (
                  <Button 
                    onClick={() => {
                      setEditingSupplier(null);
                      setShowForm(true);
                    }}
                    className="gap-2 bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20 h-12 px-6 rounded-xl font-semibold"
                  >
                    <Plus className="h-5 w-5" />
                    Novo Fornecedor
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar - Glassmorphism */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-info/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CNPJ ou contato..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-warning" />
                  <span>{filteredSuppliers.length} resultado(s)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
              </div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
                <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-info/20 flex items-center justify-center mb-6">
                  <Globe className="h-12 w-12 text-primary/50" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery ? 'Nenhum fornecedor encontrado' : 'Comece sua rede'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {!searchQuery && 'Adicione seu primeiro fornecedor para começar a gerenciar sua cadeia de suprimentos'}
              </p>
            </div>
          ) : (
            <>
              {/* Supplier Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedSuppliers.map((supplier, index) => (
                  <div 
                    key={supplier.id} 
                    className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-info/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">
                            {supplier.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {supplier.name}
                            </h3>
                            {supplier.cnpj && (
                              <Badge variant="secondary" className="font-mono text-xs mt-1 bg-muted/50">
                                {supplier.cnpj}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {!isReadOnly && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
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
                              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteConfirm(supplier.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Contact Info */}
                      <div className="space-y-2 text-sm">
                        {supplier.contact_name && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4 text-primary/60" />
                            <span>{supplier.contact_name}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4 text-success/60" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4 text-info/60" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.city && supplier.state && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 text-warning/60" />
                            <span>{supplier.city}/{supplier.state}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer */}
                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Fornecedor ativo
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-info/5 rounded-2xl blur-xl opacity-50" />
                  <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl">
                    <TablePagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                      className="px-4"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader className="bg-gradient-to-r from-primary to-info rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-white">
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
              className="gap-2 bg-gradient-to-r from-primary to-info hover:opacity-90"
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
    </DashboardLayout>
  );
}
