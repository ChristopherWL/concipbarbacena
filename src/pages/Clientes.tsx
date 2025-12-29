import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatsCard, StatsGrid } from '@/components/layout/StatsCard';
import { DataCard } from '@/components/layout/DataCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, Phone, Mail, MapPin, Loader2, Trash2, UserCheck, Building2 } from 'lucide-react';
import { useCustomers, useCreateCustomer, useDeleteCustomer } from '@/hooks/useServiceOrders';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';
import { Customer } from '@/types/serviceOrders';
import { formatCPF, formatCNPJ, formatPhone, formatCEP } from '@/lib/formatters';

export default function Clientes() {
  const { isAdmin } = useAuthContext();
  const { isReadOnly } = useDirectorBranch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'pf' as 'pf' | 'pj',
    document: '',
    email: '',
    phone: '',
    phone2: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    contact_name: '',
    notes: '',
    is_active: true,
  });

  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const handleSubmit = async () => {
    if (!formData.name) return;
    await createCustomer.mutateAsync(formData);
    setDialogOpen(false);
    setFormData({
      name: '',
      type: 'pf',
      document: '',
      email: '',
      phone: '',
      phone2: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      contact_name: '',
      notes: '',
      is_active: true,
    });
  };

  const handleDeleteCustomer = async () => {
    if (customerToDelete) {
      await deleteCustomer.mutateAsync(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  const filteredCustomers = customers?.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedCustomers,
    totalItems,
  } = usePagination(filteredCustomers, 10);

  // Stats
  const totalCustomers = customers?.length || 0;
  const activeCustomers = customers?.filter(c => c.is_active).length || 0;
  const pfCount = customers?.filter(c => c.type === 'pf').length || 0;
  const pjCount = customers?.filter(c => c.type === 'pj').length || 0;

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Clientes"
          description="Gerenciamento de clientes"
          icon={<Users className="h-5 w-5" />}
        />

        {/* Stats Grid */}
        <StatsGrid columns={4}>
          <StatsCard
            value={totalCustomers}
            label="Total de Clientes"
            icon={Users}
            variant="primary"
          />
          <StatsCard
            value={activeCustomers}
            label="Clientes Ativos"
            icon={UserCheck}
            variant="success"
          />
          <StatsCard
            value={pfCount}
            label="Pessoa Física"
            icon={Users}
            variant="info"
          />
          <StatsCard
            value={pjCount}
            label="Pessoa Jurídica"
            icon={Building2}
            variant="warning"
          />
        </StatsGrid>

        {/* Data Table */}
        <DataCard
          isLoading={isLoading}
          loadingColumns={6}
          loadingRows={5}
          header={{
            title: 'Clientes Cadastrados',
            count: { filtered: filteredCustomers.length, total: totalCustomers },
            searchValue: searchTerm,
            onSearchChange: setSearchTerm,
            searchPlaceholder: 'Buscar cliente...',
            primaryAction: !isReadOnly ? {
              label: 'Novo Cliente',
              mobileLabel: 'Novo',
              icon: Plus,
              onClick: () => setDialogOpen(true),
            } : undefined,
          }}
        >
          {filteredCustomers?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum cliente encontrado
            </p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3 p-3">
                {paginatedCustomers.map((customer) => (
                  <div key={customer.id} className="bg-card rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {customer.type === 'pj' ? 'PJ' : 'PF'}
                            </Badge>
                            <Badge variant={customer.is_active ? 'default' : 'secondary'} className="text-xs">
                              {customer.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {isAdmin() && !isReadOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setCustomerToDelete(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {customer.document && <p>{customer.document}</p>}
                      {customer.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {customer.email}
                        </p>
                      )}
                      {customer.city && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {customer.city}/{customer.state}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-16 text-center">Tipo</TableHead>
                      <TableHead className="hidden lg:table-cell">Documento</TableHead>
                      <TableHead className="hidden xl:table-cell">Contato</TableHead>
                      <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                      <TableHead className="hidden xl:table-cell">Status</TableHead>
                      {isAdmin() && !isReadOnly && <TableHead className="w-16"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{customer.type === 'pj' ? 'PJ' : 'PF'}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{customer.document || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="space-y-1">
                            {customer.phone && (
                              <p className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" /> {customer.phone}
                              </p>
                            )}
                            {customer.email && (
                              <p className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" /> {customer.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {customer.city ? `${customer.city}/${customer.state}` : '-'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                            {customer.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        {isAdmin() && !isReadOnly && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setCustomerToDelete(customer)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <TablePagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  className="px-4 border-t"
                />
              )}
            </>
          )}
        </DataCard>

        {/* Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Novo Cliente</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">Cadastrar novo cliente no sistema</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as 'pf' | 'pj' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pf">Pessoa Física</SelectItem>
                      <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{formData.type === 'pf' ? 'CPF' : 'CNPJ'}</Label>
                  <Input
                    value={formData.document}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      document: formData.type === 'pf' ? formatCPF(e.target.value) : formatCNPJ(e.target.value) 
                    })}
                    placeholder={formData.type === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    maxLength={formData.type === 'pf' ? 14 : 18}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{formData.type === 'pf' ? 'Nome *' : 'Razão Social *'}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {formData.type === 'pj' && (
                <div className="space-y-2">
                  <Label>Nome do Contato</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Telefone 2</Label>
                <Input
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: formatCEP(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || createCustomer.isPending}>
                {createCustomer.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o cliente "{customerToDelete?.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCustomer}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteCustomer.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </DashboardLayout>
  );
}
