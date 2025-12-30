import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useServiceOrders, useCreateServiceOrder, useUpdateServiceOrder, useCustomers, useCreateCustomer, useDeleteServiceOrder } from '@/hooks/useServiceOrders';
import { useTeams } from '@/hooks/useTeams';
import { useDiarioServiceOrders } from '@/hooks/useServiceOrderEtapas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Loader2, ClipboardList, Plus, UserPlus, Clock, CheckCircle, AlertTriangle, Search, Trash2, Settings, Edit, Calendar, MapPin, User, FileText, Upload, X, Image, Download, Phone, Megaphone } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';

import { ServiceOrderEditDialog } from '@/components/service-orders/ServiceOrderEditDialog';
import { ServiceOrderCardProgress } from '@/components/service-orders/ServiceOrderCardProgress';
import ServiceOrderMap from '@/components/service-orders/ServiceOrderMap';
import { SignaturePad } from '@/components/ui/signature-pad';
import { supabase } from '@/integrations/supabase/client';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { exportServiceOrderPDF } from '@/lib/exportServiceOrderPDF';

export default function OrdensServico() {
  const navigate = useNavigate();
  const { user, tenant, isLoading: authLoading, isAdmin, hasRole } = useAuthContext();
  const { isReadOnly } = useDirectorBranch();
  const { branchId, shouldFilter } = useBranchFilter();
  const tenantId = tenant?.id;
  const isTechnician = hasRole('technician') && !isAdmin();
  const { data: orders = [], isLoading: ordersLoading } = useServiceOrders();
  const { data: customers = [] } = useCustomers();
  const { data: teams = [] } = useTeams();
  const createOrder = useCreateServiceOrder();
  const updateOrder = useUpdateServiceOrder();
  const createCustomer = useCreateCustomer();
  const deleteOrder = useDeleteServiceOrder();

  const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | 'all'>('all');
  const [origemFilter, setOrigemFilter] = useState<'all' | 'interno' | 'chamado_publico'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [orderForm, setOrderForm] = useState({ customer_id: '', team_id: '', title: '', description: '', priority: 'media' as PriorityLevel, scheduled_date: '', address: '' });
  const [customerForm, setCustomerForm] = useState({ type: 'pf' as 'pf' | 'pj', name: '', document: '', phone: '', email: '', address: '', city: '', state: '' });

  // Detail dialog states
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ServiceOrder | null>(null);

  // Update (diário) form states
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    data: new Date().toISOString().split('T')[0],
    responsavel: "",
    descricao: "",
    assinatura: null as string | null,
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<{ url: string; path: string; description: string }[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Complete order dialog states
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completeSignature, setCompleteSignature] = useState<string | null>(null);
  const [showCompleteSignatureModal, setShowCompleteSignatureModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks for selected order
  const { createDiario } = useDiarioServiceOrders(selectedOrder?.id);


  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesOrigem = origemFilter === 'all' || (o as any).origem === origemFilter;
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.order_number.toString().includes(searchQuery) ||
                          ((o as any).placa_poste || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesOrigem && matchesSearch;
  });

  const chamadosCount = orders.filter(o => (o as any).origem === 'chamado_publico').length;
  const chamadosPendentes = orders.filter(o => (o as any).origem === 'chamado_publico' && o.status === 'aberta').length;

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

  const handleOpenDetail = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleOpenEditDialog = (order: ServiceOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToEdit(order);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (data: Partial<ServiceOrder> & { id: string }) => {
    await updateOrder.mutateAsync(data);
    setIsEditDialogOpen(false);
    setOrderToEdit(null);
  };

  const handleOpenUpdateDialog = (order: ServiceOrder, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedOrder(order);
    setUpdateForm({
      data: new Date().toISOString().split('T')[0],
      responsavel: "",
      descricao: "",
      assinatura: null,
    });
    setUploadedPhotos([]);
    setIsUpdateDialogOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0 || !tenantId) return;

    setIsUploadingImages(true);
    try {
      for (const file of files) {
        const fileName = `${tenantId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("obras-fotos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("obras-fotos").getPublicUrl(fileName);
        setUploadedPhotos(prev => [...prev, { url: urlData.publicUrl, path: fileName, description: "" }]);
      }
    } catch (error) {
      toast.error("Erro ao fazer upload das imagens");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitUpdate = async () => {
    if (!selectedOrder || !tenantId || !updateForm.assinatura) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      await createDiario.mutateAsync({
        service_order_id: selectedOrder.id,
        etapa_id: null,
        tenant_id: tenantId,
        branch_id: shouldFilter ? branchId : null,
        data: updateForm.data,
        registrado_por: updateForm.responsavel,
        atividades_realizadas: updateForm.descricao,
        supervisor_signature: updateForm.assinatura,
        fotos: uploadedPhotos,
        status: "registrado",
      });

      setIsUpdateDialogOpen(false);
      toast.success("Atualização registrada com sucesso!");
    } catch (error) {
      toast.error("Erro ao registrar atualização");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCompleteDialog = (order: ServiceOrder, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedOrder(order);
    setCompleteSignature(null);
    setIsCompleteDialogOpen(true);
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrder || !completeSignature) {
      toast.error("Assinatura é obrigatória para concluir a O.S.");
      return;
    }

    setIsCompleting(true);
    try {
      await updateOrder.mutateAsync({
        id: selectedOrder.id,
        status: 'concluida' as ServiceOrderStatus,
        completed_at: new Date().toISOString(),
        signature_url: completeSignature,
      });
      setIsCompleteDialogOpen(false);
      setIsDetailDialogOpen(false);
      setSelectedOrder(null);
      toast.success("O.S. concluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao concluir O.S.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDownloadPDF = (order: ServiceOrder) => {
    const companyInfo = {
      name: tenant?.name || 'Empresa',
      cnpj: tenant?.cnpj || undefined,
      address: tenant?.address || undefined,
      city: tenant?.city || undefined,
      state: tenant?.state || undefined,
      phone: tenant?.phone || undefined,
      email: tenant?.email || undefined,
    };
    exportServiceOrderPDF(order, companyInfo);
    toast.success('PDF gerado com sucesso!');
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
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-fade-in" data-tour="service-orders-content">
        <PageHeader
          title="Ordens de Serviço"
          description="Gerencie OS e clientes"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 animate-stagger">
          <Card variant="stat" onClick={() => setStatusFilter('all')} className="cursor-pointer">
            <CardContent className="p-2 sm:p-4">
              <p className="stat-value text-base sm:text-2xl">{stats.total}</p>
              <p className="stat-label text-[10px] sm:text-xs">Total</p>
            </CardContent>
          </Card>
          <Card variant="stat" onClick={() => setStatusFilter('aberta')} className="cursor-pointer">
            <CardContent className="p-2 sm:p-4">
              <p className="stat-value text-info text-base sm:text-2xl">{stats.abertas}</p>
              <p className="stat-label text-[10px] sm:text-xs">Abertas</p>
            </CardContent>
          </Card>
          <Card variant="stat" onClick={() => setStatusFilter('em_andamento')} className="cursor-pointer">
            <CardContent className="p-2 sm:p-4">
              <p className="stat-value text-warning text-base sm:text-2xl">{stats.andamento}</p>
              <p className="stat-label text-[10px] sm:text-xs truncate">Andamento</p>
            </CardContent>
          </Card>
          <Card variant="stat" onClick={() => setStatusFilter('concluida')} className="cursor-pointer">
            <CardContent className="p-2 sm:p-4">
              <p className="stat-value text-success text-base sm:text-2xl">{stats.concluidas}</p>
              <p className="stat-label text-[10px] sm:text-xs">Concluídas</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader className="p-2 sm:p-4 pb-2 sm:pb-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 sm:h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={origemFilter} onValueChange={v => setOrigemFilter(v as 'all' | 'interno' | 'chamado_publico')}>
                  <SelectTrigger className="w-28 sm:w-36 h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="interno">Interno</SelectItem>
                    <SelectItem value="chamado_publico">
                      <span className="flex items-center gap-1">
                        Chamados {chamadosPendentes > 0 && <Badge variant="destructive" className="text-xs px-1">{chamadosPendentes}</Badge>}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as ServiceOrderStatus | 'all')}>
                  <SelectTrigger className="w-28 sm:w-40 h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(SERVICE_ORDER_STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isReadOnly && (
                  <Button onClick={() => setOrderDialogOpen(true)} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-4">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Nova OS</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-2 sm:pb-4">
            {ordersLoading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhuma OS encontrada</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-3">
                {filteredOrders.map(order => (
                  <Card 
                    key={order.id} 
                    className="border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleOpenDetail(order)}
                  >
                    <CardContent className="p-2 sm:p-4">
                      <div className="flex flex-col gap-2 sm:gap-3">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="font-mono text-xs sm:text-sm text-muted-foreground">#{order.order_number.toString().padStart(5, '0')}</span>
                            <h3 className="font-semibold text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">{order.title}</h3>
                            <Badge className={`${PRIORITY_COLORS[order.priority]} text-[10px] sm:text-xs px-1.5 sm:px-2`}>{PRIORITY_LABELS[order.priority]}</Badge>
                          </div>
                          
                          {/* Desktop actions */}
                          {!isReadOnly && (
                            <div className="hidden sm:flex items-center gap-2">
                              <Button variant="outline" size="icon" onClick={(e) => handleOpenEditDialog(order, e)} title="Editar OS">
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button onClick={(e) => handleOpenUpdateDialog(order, e)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Atualizar
                              </Button>
                              {isAdmin() && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); setOrderToDelete(order); }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Info grid - compact on mobile */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                          {order.customer?.name && (
                            <div className="flex items-center gap-1 min-w-0">
                              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[100px] sm:max-w-none">{order.customer.name}</span>
                            </div>
                          )}
                          {order.scheduled_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                              <span>{new Date(order.scheduled_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            <span>{SERVICE_ORDER_STATUS_LABELS[order.status]}</span>
                          </div>
                        </div>

                        {/* Progress */}
                        {tenantId && <ServiceOrderCardProgress serviceOrderId={order.id} tenantId={tenantId} />}
                        
                        {/* Mobile actions - more compact */}
                        {!isReadOnly && (
                          <div className="flex sm:hidden items-center gap-1.5 pt-2 border-t border-border/20">
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={(e) => handleOpenEditDialog(order, e)}>
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button className="flex-1 h-7 text-xs" size="sm" onClick={(e) => handleOpenUpdateDialog(order, e)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Atualizar
                            </Button>
                            {isAdmin() && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-7 px-2"
                                onClick={(e) => { e.stopPropagation(); setOrderToDelete(order); }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
          setIsDetailDialogOpen(open);
          if (!open) setSelectedOrder(null);
        }}>
          <DialogContent className="w-full max-w-3xl max-h-[90vh] p-0 sm:p-0 bg-transparent shadow-none border-0">
            <div className="bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <DialogHeader className="bg-primary px-6 pt-6 pb-4 rounded-t-xl flex-shrink-0">
                <DialogTitle className="text-primary-foreground">
                  #{selectedOrder?.order_number.toString().padStart(5, '0')} - {selectedOrder?.title}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 min-h-0 space-y-6">

                {/* Order Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      Informações da OS
                      {(selectedOrder as any)?.origem === 'chamado_publico' && (
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
                          <Megaphone className="w-3 h-3 mr-1" />
                          Chamado Público
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {/* Map for chamados with coordinates */}
                    {(selectedOrder as any)?.latitude && (selectedOrder as any)?.longitude && (
                      <ServiceOrderMap 
                        latitude={Number((selectedOrder as any).latitude)} 
                        longitude={Number((selectedOrder as any).longitude)}
                        address={selectedOrder?.address}
                        height="200px"
                        className="mb-3"
                      />
                    )}
                    
                    {/* Chamado specific info */}
                    {(selectedOrder as any)?.origem === 'chamado_publico' && (
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 space-y-2">
                        {(selectedOrder as any)?.placa_poste && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Placa Poste:</span>
                            <span className="font-mono font-semibold">{(selectedOrder as any).placa_poste}</span>
                          </div>
                        )}
                        {(selectedOrder as any)?.solicitante_nome && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{(selectedOrder as any).solicitante_nome}</span>
                          </div>
                        )}
                        {(selectedOrder as any)?.solicitante_telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{(selectedOrder as any).solicitante_telefone}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedOrder?.customer?.name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.customer.name}</span>
                      </div>
                    )}
                    {selectedOrder?.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.address}</span>
                      </div>
                    )}
                    {selectedOrder?.description && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{selectedOrder.description}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadPDF(selectedOrder!)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                  {!isReadOnly && (
                    <>
                      <Button onClick={() => handleOpenUpdateDialog(selectedOrder!)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Registrar Atualização
                      </Button>
                      {selectedOrder?.status !== 'concluida' && (
                        <Button 
                          variant="default"
                          className="bg-success hover:bg-success/90"
                          onClick={(e) => handleOpenCompleteDialog(selectedOrder!, e)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Concluir O.S.
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Update (Diário) Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="w-full max-w-lg max-h-[90vh] p-0 sm:p-0 bg-transparent shadow-none border-0">
            <div className="bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <DialogHeader className="bg-primary px-6 pt-6 pb-4 rounded-t-xl flex-shrink-0">
                <DialogTitle className="text-primary-foreground">Registrar Atualização</DialogTitle>
                <DialogDescription className="text-primary-foreground/80">
                  {selectedOrder?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 min-h-0 space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={updateForm.data}
                      onChange={(e) => setUpdateForm({ ...updateForm, data: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Input
                      placeholder="Nome do responsável"
                      value={updateForm.responsavel}
                      onChange={(e) => setUpdateForm({ ...updateForm, responsavel: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição das Atividades</Label>
                  <Textarea
                    placeholder="Descreva as atividades realizadas..."
                    rows={3}
                    value={updateForm.descricao}
                    onChange={(e) => setUpdateForm({ ...updateForm, descricao: e.target.value })}
                  />
                </div>

                {/* Photos */}
                <div className="space-y-2">
                  <Label>Fotos</Label>
                  <div className="flex gap-2 flex-wrap">
                    {uploadedPhotos.map((photo, idx) => (
                      <div key={idx} className="relative w-16 h-16">
                        <img src={photo.url} className="w-full h-full object-cover rounded" />
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                          onClick={() => removePhoto(idx)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="w-16 h-16"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImages}
                    >
                      {isUploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>

                {/* Signature */}
                <div className="space-y-2">
                  <Label>Assinatura do Responsável *</Label>
                  {updateForm.assinatura ? (
                    <div className="border rounded p-2 bg-muted/50">
                      <img src={updateForm.assinatura} alt="Assinatura" className="h-16 mx-auto" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setUpdateForm({ ...updateForm, assinatura: null })}
                      >
                        Refazer Assinatura
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowSignatureModal(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Assinar
                    </Button>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmitUpdate}
                    disabled={isSubmitting || !updateForm.assinatura}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar Atualização
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Signature Modal */}
        <SignaturePad
          open={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSave={(signature) => {
            setUpdateForm({ ...updateForm, assinatura: signature });
            setShowSignatureModal(false);
          }}
        />

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

        {/* Edit Order Dialog */}
        <ServiceOrderEditDialog
          order={orderToEdit}
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setOrderToEdit(null);
          }}
          onSave={handleSaveEdit}
          isPending={updateOrder.isPending}
        />

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

        {/* Complete Order Dialog */}
        <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
          <DialogContent className="w-full max-w-md max-h-[90vh] p-0 sm:p-0 bg-transparent shadow-none border-0">
            <div className="bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <DialogHeader className="bg-success px-6 pt-6 pb-4 rounded-t-xl flex-shrink-0">
                <DialogTitle className="text-success-foreground">Concluir Ordem de Serviço</DialogTitle>
                <DialogDescription className="text-success-foreground/80">
                  #{selectedOrder?.order_number.toString().padStart(5, '0')} - {selectedOrder?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 min-h-0 space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Ao concluir esta O.S., ela será marcada como finalizada.</p>
                  <p className="mt-2 font-medium text-foreground">É necessário assinar para confirmar a conclusão.</p>
                </div>

                {/* Signature */}
                <div className="space-y-2">
                  <Label>Assinatura do Responsável *</Label>
                  {completeSignature ? (
                    <div className="border rounded-lg p-2 bg-muted/50">
                      <img src={completeSignature} alt="Assinatura" className="max-h-24 mx-auto" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setCompleteSignature(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar Assinatura
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowCompleteSignatureModal(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Assinar
                    </Button>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="bg-success hover:bg-success/90"
                    onClick={handleCompleteOrder}
                    disabled={isCompleting || !completeSignature}
                  >
                    {isCompleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Conclusão
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Signature Modal for Complete */}
        <SignaturePad
          open={showCompleteSignatureModal}
          onClose={() => setShowCompleteSignatureModal(false)}
          onSave={(sig) => {
            setCompleteSignature(sig);
            setShowCompleteSignatureModal(false);
          }}
          title="Assinatura de Conclusão"
        />
      </div>
    </DashboardLayout>
  );
}
