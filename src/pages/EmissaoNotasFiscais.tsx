import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, FileText, Send, Eye, Download, Printer, QrCode, Receipt, FileCheck, X, Loader2 } from 'lucide-react';
import { useFiscalNotes, useCreateFiscalNote, FiscalNoteType, FiscalNote, CreateFiscalNoteItemInput } from '@/hooks/useFiscalNotes';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export default function EmissaoNotasFiscais() {
  const [activeTab, setActiveTab] = useState<FiscalNoteType>('nfe');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<FiscalNote | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    customer_document: '',
    operation_nature: '',
    freight_value: 0,
    discount_value: 0,
    products_value: 0,
    service_code: '',
    service_description: '',
    deductions: 0,
    iss_rate: 5,
    competence_date: '',
    notes: '',
  });
  const [items, setItems] = useState<CreateFiscalNoteItemInput[]>([]);
  const [newItem, setNewItem] = useState<CreateFiscalNoteItemInput>({
    product_id: null,
    description: '',
    quantity: 1,
    unit_price: 0,
  });

  const { profile } = useAuth();
  const { data: nfes = [], isLoading: loadingNfe } = useFiscalNotes('nfe');
  const { data: nfces = [], isLoading: loadingNfce } = useFiscalNotes('nfce');
  const { data: nfses = [], isLoading: loadingNfse } = useFiscalNotes('nfse');
  const { data: products = [] } = useProducts();
  const createFiscalNote = useCreateFiscalNote();

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, document')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'autorizada':
        return <Badge className="bg-green-500">Autorizada</Badge>;
      case 'cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'rejeitada':
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      customer_document: '',
      operation_nature: '',
      freight_value: 0,
      discount_value: 0,
      products_value: 0,
      service_code: '',
      service_description: '',
      deductions: 0,
      iss_rate: 5,
      competence_date: '',
      notes: '',
    });
    setItems([]);
    setNewItem({ product_id: null, description: '', quantity: 1, unit_price: 0 });
  };

  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unit_price <= 0) return;
    setItems([...items, newItem]);
    setNewItem({ product_id: null, description: '', quantity: 1, unit_price: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData({
      ...formData,
      customer_id: customerId,
      customer_name: customer?.name || '',
      customer_document: customer?.document || '',
    });
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewItem({
        ...newItem,
        product_id: productId,
        description: product.name,
        unit_price: product.sale_price || product.cost_price || 0,
      });
    }
  };

  const calculateItemsTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async () => {
    const input = {
      note_type: activeTab,
      customer_id: formData.customer_id || null,
      customer_name: formData.customer_name,
      customer_document: formData.customer_document,
      operation_nature: formData.operation_nature,
      freight_value: formData.freight_value,
      discount_value: formData.discount_value,
      products_value: activeTab === 'nfse' ? formData.products_value : calculateItemsTotal(),
      service_code: formData.service_code,
      service_description: formData.service_description,
      deductions: formData.deductions,
      iss_rate: formData.iss_rate,
      competence_date: formData.competence_date || undefined,
      notes: formData.notes,
      items: activeTab !== 'nfse' ? items : undefined,
    };

    await createFiscalNote.mutateAsync(input);
    setIsDialogOpen(false);
    resetForm();
  };

  const filterNotes = (notes: FiscalNote[]) => {
    if (!searchTerm) return notes;
    const term = searchTerm.toLowerCase();
    return notes.filter(note => 
      note.numero.toLowerCase().includes(term) ||
      note.customer_name?.toLowerCase().includes(term) ||
      note.customer_document?.toLowerCase().includes(term)
    );
  };

  const getDialogContent = () => {
    switch (activeTab) {
      case 'nfe':
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Natureza da Operação</Label>
                <Select value={formData.operation_nature} onValueChange={(v) => setFormData({ ...formData, operation_nature: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda de Mercadoria</SelectItem>
                    <SelectItem value="servico">Prestação de Serviço</SelectItem>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                    <SelectItem value="remessa">Remessa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Produtos</Label>
              <Card>
                <CardContent className="p-3 sm:p-4 space-y-3">
                  {items.length > 0 && (
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm truncate block">{item.description}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.quantity} x {item.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-medium text-sm">
                              {(item.quantity * item.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <Select value={newItem.product_id || ''} onValueChange={handleProductChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      placeholder="Qtd"
                      value={newItem.quantity || ''}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      placeholder="Preço"
                      value={newItem.unit_price || ''}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                    />
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor dos Produtos</Label>
                <Input type="number" value={calculateItemsTotal().toFixed(2)} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Frete</Label>
                <Input 
                  type="number" 
                  placeholder="0,00" 
                  value={formData.freight_value || ''}
                  onChange={(e) => setFormData({ ...formData, freight_value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <Input 
                  type="number" 
                  placeholder="0,00"
                  value={formData.discount_value || ''}
                  onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Informações Adicionais</Label>
              <Textarea 
                placeholder="Observações..." 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        );

      case 'nfce':
        return (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>CPF do Consumidor (opcional)</Label>
              <Input 
                placeholder="000.000.000-00" 
                value={formData.customer_document}
                onChange={(e) => setFormData({ ...formData, customer_document: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Itens da Venda</Label>
              <Card>
                <CardContent className="p-3 sm:p-4 space-y-3">
                  {items.length > 0 && (
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm truncate block">{item.description}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.quantity} x {item.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-medium text-sm">
                              {(item.quantity * item.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <Select value={newItem.product_id || ''} onValueChange={handleProductChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      placeholder="Qtd"
                      value={newItem.quantity || ''}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      placeholder="Preço"
                      value={newItem.unit_price || ''}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                    />
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtotal</Label>
                <Input type="number" value={calculateItemsTotal().toFixed(2)} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <Input 
                  type="number" 
                  placeholder="0,00"
                  value={formData.discount_value || ''}
                  onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Total</Label>
              <Input 
                type="number" 
                value={(calculateItemsTotal() - formData.discount_value).toFixed(2)} 
                readOnly 
                className="text-lg font-bold bg-muted" 
              />
            </div>
          </div>
        );

      case 'nfse':
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tomador do Serviço</Label>
                <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Competência</Label>
                <Input 
                  type="date" 
                  value={formData.competence_date}
                  onChange={(e) => setFormData({ ...formData, competence_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Código do Serviço (LC 116)</Label>
              <Select value={formData.service_code} onValueChange={(v) => setFormData({ ...formData, service_code: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o código" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.01">1.01 - Análise e desenvolvimento</SelectItem>
                  <SelectItem value="1.02">1.02 - Programação</SelectItem>
                  <SelectItem value="1.03">1.03 - Processamento de dados</SelectItem>
                  <SelectItem value="1.04">1.04 - Elaboração de programas</SelectItem>
                  <SelectItem value="7.01">7.01 - Engenharia</SelectItem>
                  <SelectItem value="7.02">7.02 - Execução de obras</SelectItem>
                  <SelectItem value="14.01">14.01 - Manutenção em geral</SelectItem>
                  <SelectItem value="14.02">14.02 - Assistência técnica</SelectItem>
                  <SelectItem value="17.01">17.01 - Assessoria ou consultoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Discriminação do Serviço</Label>
              <Textarea 
                placeholder="Descreva o serviço prestado..." 
                rows={3}
                value={formData.service_description}
                onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor do Serviço</Label>
                <Input 
                  type="number" 
                  placeholder="0,00"
                  value={formData.products_value || ''}
                  onChange={(e) => setFormData({ ...formData, products_value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Deduções</Label>
                <Input 
                  type="number" 
                  placeholder="0,00"
                  value={formData.deductions || ''}
                  onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Alíquota ISS (%)</Label>
                <Input 
                  type="number" 
                  placeholder="5,00"
                  value={formData.iss_rate || ''}
                  onChange={(e) => setFormData({ ...formData, iss_rate: Number(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Informações Adicionais</Label>
              <Textarea 
                placeholder="Observações..." 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    switch (activeTab) {
      case 'nfe': return 'Emitir NF-e (Produtos)';
      case 'nfce': return 'Emitir NFC-e (Cupom Fiscal)';
      case 'nfse': return 'Emitir NFS-e (Serviços)';
      default: return 'Emitir Nota Fiscal';
    }
  };

  const getButtonLabel = () => {
    switch (activeTab) {
      case 'nfe': return 'Emitir NF-e';
      case 'nfce': return 'Emitir NFC-e';
      case 'nfse': return 'Emitir NFS-e';
      default: return 'Emitir';
    }
  };

  const renderTable = (notes: FiscalNote[], isLoading: boolean, type: FiscalNoteType) => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    const filteredNotes = filterNotes(notes);

    if (filteredNotes.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma nota fiscal encontrada
        </div>
      );
    }

    return (
      <>
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{note.numero}</span>
                    <Badge variant="outline" className="text-xs">Série {note.serie}</Badge>
                    {getStatusBadge(note.status)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {note.customer_name || note.customer_document || 'Não identificado'}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {new Date(note.issue_date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="font-semibold text-foreground">
                      {Number(note.total_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedNote(note);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {type === 'nfce' ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8"><QrCode className="h-4 w-4" /></Button>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>
                  {type === 'nfce' ? 'CPF' : type === 'nfse' ? 'Tomador' : 'Cliente'}
                </TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">{note.numero}</TableCell>
                  <TableCell>{note.serie}</TableCell>
                  <TableCell>
                    {note.customer_name || note.customer_document || 'Não identificado'}
                  </TableCell>
                  <TableCell>
                    {new Date(note.issue_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(note.total_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>{getStatusBadge(note.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedNote(note);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {type === 'nfce' ? (
                        <Button variant="ghost" size="icon"><QrCode className="h-4 w-4" /></Button>
                      ) : (
                        <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <PageHeader 
          title="Emissão de Notas Fiscais" 
          description="Emita NF-e, NFC-e e NFS-e"
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FiscalNoteType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="nfe" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">NF-e</span>
              <span className="sm:hidden">NF-e</span>
            </TabsTrigger>
            <TabsTrigger value="nfce" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">NFC-e</span>
              <span className="sm:hidden">NFC-e</span>
            </TabsTrigger>
            <TabsTrigger value="nfse" className="gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">NFS-e</span>
              <span className="sm:hidden">NFS-e</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {getButtonLabel()}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{getDialogTitle()}</DialogTitle>
                </DialogHeader>
                {getDialogContent()}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={createFiscalNote.isPending}>
                    {createFiscalNote.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {getButtonLabel()}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* NF-e Tab */}
          <TabsContent value="nfe">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">NF-e - Nota Fiscal Eletrônica</CardTitle>
                <CardDescription>Notas fiscais para produtos</CardDescription>
              </CardHeader>
              <CardContent>
                {renderTable(nfes, loadingNfe, 'nfe')}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NFC-e Tab */}
          <TabsContent value="nfce">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">NFC-e - Cupom Fiscal Eletrônico</CardTitle>
                <CardDescription>Cupons fiscais para consumidor final</CardDescription>
              </CardHeader>
              <CardContent>
                {renderTable(nfces, loadingNfce, 'nfce')}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NFS-e Tab */}
          <TabsContent value="nfse">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">NFS-e - Nota Fiscal de Serviço</CardTitle>
                <CardDescription>Notas fiscais de serviço</CardDescription>
              </CardHeader>
              <CardContent>
                {renderTable(nfses, loadingNfse, 'nfse')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Note Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
            </DialogHeader>
            {selectedNote && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Número</Label>
                    <p className="font-medium">{selectedNote.numero}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Série</Label>
                    <p className="font-medium">{selectedNote.serie}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data de Emissão</Label>
                    <p className="font-medium">
                      {new Date(selectedNote.issue_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p>{getStatusBadge(selectedNote.status)}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Cliente/Tomador</Label>
                  <p className="font-medium">{selectedNote.customer_name || 'Não identificado'}</p>
                  {selectedNote.customer_document && (
                    <p className="text-sm text-muted-foreground">{selectedNote.customer_document}</p>
                  )}
                </div>
                
                {selectedNote.note_type === 'nfse' && selectedNote.service_description && (
                  <div>
                    <Label className="text-muted-foreground">Serviço</Label>
                    <p className="font-medium">{selectedNote.service_description}</p>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground">Valor Total</Label>
                    <p className="text-xl font-bold">
                      {Number(selectedNote.total_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
                
                {selectedNote.notes && (
                  <div>
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="text-sm">{selectedNote.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
