import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useServiceOrders, useCreateServiceOrder, useUpdateServiceOrder, useCustomers, useCreateCustomer, useDeleteServiceOrder } from '@/hooks/useServiceOrders';
import { useTeams } from '@/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
import { SERVICE_ORDER_STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, ServiceOrderStatus, PriorityLevel, ServiceOrder } from '@/types/serviceOrders';
import { Loader2, ClipboardList, Plus, UserPlus, Clock, CheckCircle, AlertTriangle, Search, Trash2 } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';

export default function OrdensServico() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin, hasRole } = useAuthContext();
  const { isReadOnly } = useDirectorBranch();
  const isTechnician = hasRole('technician') && !isAdmin();
  const { data: orders = [], isLoading: ordersLoading } = useServiceOrders();
  const { data: customers = [] } = useCustomers();
  const { data: teams = [] } = useTeams();
  const createOrder = useCreateServiceOrder();
  const updateOrder = useUpdateServiceOrder();
  const createCustomer = useCreateCustomer();
  const deleteOrder = useDeleteServiceOrder();

  const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [orderForm, setOrderForm] = useState({ customer_id: '', team_id: '', title: '', description: '', priority: 'media' as PriorityLevel, scheduled_date: '', address: '' });
  const [customerForm, setCustomerForm] = useState({ type: 'pf' as 'pf' | 'pj', name: '', document: '', phone: '', email: '', address: '', city: '', state: '' });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [user, authLoading, navigate]);

  if (authLoading) return <PageLoading text="Carregando ordens de serviço" />;
  if (!user) return null;

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.order_number.toString().includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleCreateOrder = async () => {
    if (!orderForm.customer_id || !orderForm.title) { toast.error('Preencha os campos obrigatórios'); return; }
    await createOrder.mutateAsync({
      ...orderForm,
      status: 'aberta',
      team_id: orderForm.team_id || null,
      scheduled_date: orderForm.scheduled_date || null,
      labor_cost: 0,
      materials_cost: 0,
      total_cost: 0,
      photos: [],
    });
    setOrderDialogOpen(false);
    setOrderForm({ customer_id: '', team_id: '', title: '', description: '', priority: 'media', scheduled_date: '', address: '' });
  };

  const handleCreateCustomer = async () => {
    if (!customerForm.name) { toast.error('Nome é obrigatório'); return; }
    await createCustomer.mutateAsync({ ...customerForm, is_active: true });
    setCustomerDialogOpen(false);
    setCustomerForm({ type: 'pf', name: '', document: '', phone: '', email: '', address: '', city: '', state: '' });
  };

  const handleStatusChange = async (id: string, status: ServiceOrderStatus) => {
    const updates: any = { status };
    if (status === 'em_andamento') updates.started_at = new Date().toISOString();
    if (status === 'concluida') updates.completed_at = new Date().toISOString();
    await updateOrder.mutateAsync({ id, ...updates });
  };

  const handleDeleteOrder = async () => {
    if (orderToDelete) {
      await deleteOrder.mutateAsync(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  const getStatusIcon = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'aberta': return <Clock className="h-4 w-4" />;
      case 'em_andamento': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'aguardando': return <AlertTriangle className="h-4 w-4" />;
      case 'concluida': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const stats = {
    total: orders.length,
    abertas: orders.filter(o => o.status === 'aberta').length,
    andamento: orders.filter(o => o.status === 'em_andamento').length,
    concluidas: orders.filter(o => o.status === 'concluida').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in" data-tour="service-orders-content">
        <PageHeader
          title="Ordens de Serviço"
          description="Gerencie OS e clientes"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        {!isReadOnly && !isTechnician && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setCustomerDialogOpen(true)} className="hover-lift">
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo Cliente</span>
              <span className="sm:hidden">Cliente</span>
            </Button>
            <Button onClick={() => setOrderDialogOpen(true)} className="hover-lift">
              <Plus className="h-4 w-4 mr-2" />
              Nova OS
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-stagger">
          <Card variant="stat" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-4">
              <p className="stat-value">{stats.total}</p>
              <p className="stat-label">Total</p>
            </CardContent>
          </Card>
          <Card variant="stat" onClick={() => setStatusFilter('aberta')}>
            <CardContent className="p-4">
              <p className="stat-value text-info">{stats.abertas}</p>
              <p className="stat-label">Abertas</p>
            </CardContent>
          </Card>
          <Card variant="stat" onClick={() => setStatusFilter('em_andamento')}>
            <CardContent className="p-4">
              <p className="stat-value text-warning">{stats.andamento}</p>
              <p className="stat-label">Em Andamento</p>
            </CardContent>
          </Card>
          <Card variant="stat" onClick={() => setStatusFilter('concluida')}>
            <CardContent className="p-4">
              <p className="stat-value text-success">{stats.concluidas}</p>
              <p className="stat-label">Concluídas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex justify-center">
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as ServiceOrderStatus | 'all')}><SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(SERVICE_ORDER_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {ordersLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : filteredOrders.length === 0 ? (
            <Card variant="glass"><CardContent className="py-12 text-center"><ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" /><p className="text-muted-foreground">Nenhuma OS encontrada</p></CardContent></Card>
          ) : filteredOrders.map(order => (
            <Card key={order.id} variant="elevated" className="group">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">#{order.order_number.toString().padStart(5, '0')}</span>
                      <Badge className={PRIORITY_COLORS[order.priority]}>{PRIORITY_LABELS[order.priority]}</Badge>
                    </div>
                    <h3 className="font-semibold">{order.title}</h3>
                    <p className="text-sm text-muted-foreground">{order.customer?.name}</p>
                    {order.scheduled_date && <p className="text-xs text-muted-foreground mt-1">Agendado: {new Date(order.scheduled_date).toLocaleDateString('pt-BR')}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={order.status} onValueChange={v => handleStatusChange(order.id, v as ServiceOrderStatus)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(SERVICE_ORDER_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}><div className="flex items-center gap-2">{getStatusIcon(v as ServiceOrderStatus)}{l}</div></SelectItem>)}</SelectContent>
                    </Select>
                    {isAdmin() && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setOrderToDelete(order)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Order Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Nova Ordem de Serviço</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">Crie uma nova OS</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cliente *</Label>
                <Select value={orderForm.customer_id} onValueChange={v => setOrderForm({...orderForm, customer_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título *</Label>
                <Input placeholder="Descrição breve do serviço" value={orderForm.title} onChange={e => setOrderForm({...orderForm, title: e.target.value})} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea placeholder="Detalhes do serviço..." value={orderForm.description} onChange={e => setOrderForm({...orderForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Equipe</Label>
                  <Select value={orderForm.team_id} onValueChange={v => setOrderForm({...orderForm, team_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={orderForm.priority} onValueChange={v => setOrderForm({...orderForm, priority: v as PriorityLevel})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Data Agendada</Label>
                  <Input type="date" value={orderForm.scheduled_date} onChange={e => setOrderForm({...orderForm, scheduled_date: e.target.value})} />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input placeholder="Local do serviço" value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value})} />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateOrder} disabled={createOrder.isPending}>
                  {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar OS'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Customer Dialog */}
        <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Novo Cliente</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">Cadastre um novo cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={customerForm.type} onValueChange={v => setCustomerForm({...customerForm, type: v as 'pf' | 'pj'})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pf">Pessoa Física</SelectItem>
                      <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{customerForm.type === 'pf' ? 'CPF' : 'CNPJ'}</Label>
                  <Input placeholder={customerForm.type === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'} value={customerForm.document} onChange={e => setCustomerForm({...customerForm, document: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Nome *</Label>
                <Input placeholder="Nome completo ou Razão Social" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <Input placeholder="(11) 99999-9999" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" placeholder="email@exemplo.com" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Endereço</Label>
                <Input placeholder="Rua, número, bairro" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <Input placeholder="São Paulo" value={customerForm.city} onChange={e => setCustomerForm({...customerForm, city: e.target.value})} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input placeholder="SP" maxLength={2} value={customerForm.state} onChange={e => setCustomerForm({...customerForm, state: e.target.value.toUpperCase()})} />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateCustomer} disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cadastrar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Order Confirmation */}
        <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar ordem de serviço?</AlertDialogTitle>
              <AlertDialogDescription>
                A OS #{orderToDelete?.order_number.toString().padStart(5, '0')} - "{orderToDelete?.title}" será cancelada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Cancelar OS
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}