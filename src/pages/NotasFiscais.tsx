import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useInvoices, useCreateStandaloneInvoice, useUpdateInvoice, useDeleteInvoice } from '@/hooks/useInvoices';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, FileText, Download, Eye, Search, X, Upload, Loader2, Trash2, AlertTriangle, Info, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PdfInlineViewer } from '@/components/invoices/PdfInlineViewer';
import { Invoice } from '@/types/stock';

export default function NotasFiscais() {
  const { tenant } = useAuthContext();
  const { data: invoices, isLoading } = useInvoices();
  const { data: suppliers } = useSuppliers();
  const createStandaloneInvoice = useCreateStandaloneInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Form state for standalone invoice
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_series: '',
    invoice_key: '',
    issue_date: '',
    supplier_id: '',
    total_value: '',
    notes: '',
    pdf_url: '',
  });

  // Get month/year from issue_date or current date
  const selectedMonth = formData.issue_date 
    ? new Date(formData.issue_date).getMonth() + 1 
    : new Date().getMonth() + 1;
  const selectedYear = formData.issue_date 
    ? new Date(formData.issue_date).getFullYear() 
    : new Date().getFullYear();

  // Check if month is closed (fechamento)
  const { data: closedMonth } = useQuery({
    queryKey: ['fechamento_mensal_nf', tenant?.id, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!tenant?.id) return null;
      
      const { data, error } = await supabase
        .from('fechamentos_mensais')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('reference_month', selectedMonth)
        .eq('reference_year', selectedYear)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id && !!formData.issue_date,
  });

  // Fetch cupons (coupons) for the selected supplier in the selected month period
  const { data: supplierCoupons } = useQuery({
    queryKey: ['supplier_coupons_nf', tenant?.id, formData.supplier_id, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!tenant?.id || !formData.supplier_id) return [];
      
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = selectedMonth === 12 
        ? `${selectedYear + 1}-01-01` 
        : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_value, issue_date')
        .eq('tenant_id', tenant.id)
        .eq('supplier_id', formData.supplier_id)
        .gte('issue_date', startDate)
        .lt('issue_date', endDate);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id && !!formData.supplier_id && !!formData.issue_date,
  });

  // Calculate total from fechamento (cupons) for selected supplier
  const supplierFechamentoTotal = useMemo(() => {
    if (!supplierCoupons || supplierCoupons.length === 0) return 0;
    return supplierCoupons.reduce((sum, coupon) => sum + (coupon.total_value || 0), 0);
  }, [supplierCoupons]);

  // Check if entered value matches the fechamento total
  const enteredValue = parseFloat(formData.total_value) || 0;
  const hasValueMismatch = closedMonth && formData.supplier_id && formData.total_value && 
    Math.abs(enteredValue - supplierFechamentoTotal) > 0.01;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Convert Supabase storage URL to proxy URL to avoid ad blocker issues
  const getProxyUrl = (storageUrl: string | null | undefined, forDownload = false) => {
    if (!storageUrl) return null;
    
    // Extract the file path from the storage URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/tenant-assets/path/to/file.pdf
    const match = storageUrl.match(/\/tenant-assets\/(.+)$/);
    if (!match) return storageUrl; // Return original if not a storage URL
    
    const filePath = match[1];
    const downloadParam = forDownload ? '&download=true' : '';
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-attachment?path=${encodeURIComponent(filePath)}${downloadParam}`;
  };

  useEffect(() => {
    if (!previewUrl) {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
      setPreviewMime(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        setPreviewLoading(true);

        // Get session for authorization header
        const { data: { session } } = await supabase.auth.getSession();
        
        // Fetch the file with authorization header
        const res = await fetch(previewUrl, { 
          signal: controller.signal,
          headers: session?.access_token ? {
            'Authorization': `Bearer ${session.access_token}`
          } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const mime = res.headers.get('content-type');
        const blob = await res.blob();

        if (cancelled) return;

        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        setPreviewMime(mime);
        setPreviewObjectUrl(URL.createObjectURL(blob));
      } catch (e) {
        if (!cancelled) {
          console.error('Preview fetch error:', e);
          toast.error('Não foi possível carregar o anexo para visualização.');
          setPreviewObjectUrl(null);
          setPreviewMime(null);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WEBP.');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!tenant?.id) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${tenant.id}/invoices/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('tenant-assets')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      throw new Error('Erro ao fazer upload do arquivo');
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invoice_number || !formData.issue_date) {
      toast.error('Número da nota e data de emissão são obrigatórios');
      return;
    }

    try {
      setIsUploading(true);
      
      let pdfUrl = formData.pdf_url;
      
      // Upload file if selected
      if (selectedFile) {
        pdfUrl = await uploadFile(selectedFile) || '';
      }

      if (editingInvoice) {
        // Update existing invoice
        await updateInvoice.mutateAsync({
          id: editingInvoice.id,
          invoice_number: formData.invoice_number,
          invoice_series: formData.invoice_series || undefined,
          invoice_key: formData.invoice_key || undefined,
          issue_date: formData.issue_date,
          supplier_id: formData.supplier_id || undefined,
          total_value: formData.total_value ? parseFloat(formData.total_value) : undefined,
          notes: formData.notes || undefined,
          pdf_url: pdfUrl || undefined,
        });
      } else {
        // Create new invoice
        await createStandaloneInvoice.mutateAsync({
          invoice_number: formData.invoice_number,
          invoice_series: formData.invoice_series || undefined,
          invoice_key: formData.invoice_key || undefined,
          issue_date: formData.issue_date,
          supplier_id: formData.supplier_id || undefined,
          total_value: formData.total_value ? parseFloat(formData.total_value) : undefined,
          notes: formData.notes || undefined,
          pdf_url: pdfUrl || undefined,
        });
      }
      
      setFormData({
        invoice_number: '',
        invoice_series: '',
        invoice_key: '',
        issue_date: '',
        supplier_id: '',
        total_value: '',
        notes: '',
        pdf_url: '',
      });
      setSelectedFile(null);
      setEditingInvoice(null);
      setIsFormOpen(false);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number || '',
      invoice_series: invoice.invoice_series || '',
      invoice_key: invoice.invoice_key || '',
      issue_date: invoice.issue_date || '',
      supplier_id: invoice.supplier_id || '',
      total_value: invoice.total_value?.toString() || '',
      notes: invoice.notes || '',
      pdf_url: invoice.pdf_url || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingInvoiceId) return;
    
    try {
      await deleteInvoice.mutateAsync(deletingInvoiceId);
      setDeletingInvoiceId(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setFormData({
        invoice_number: '',
        invoice_series: '',
        invoice_key: '',
        issue_date: '',
        supplier_id: '',
        total_value: '',
        notes: '',
        pdf_url: '',
      });
      setSelectedFile(null);
      setEditingInvoice(null);
    }
    setIsFormOpen(open);
  };

  const filteredInvoices = invoices?.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (invoice.supplier as any)?.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col items-center text-center gap-2 sm:-mt-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Notas Fiscais
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie todas as notas fiscais de entrada
          </p>
        </div>
        <div className="flex justify-center">
          <Dialog open={isFormOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Nota Avulsa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
                <DialogTitle className="text-primary-foreground">
                  {editingInvoice ? 'Editar Nota Fiscal' : 'Cadastrar Nota Fiscal Avulsa'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Número da Nota *</Label>
                    <Input
                      id="invoice_number"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      placeholder="000123"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_series">Série</Label>
                    <Input
                      id="invoice_series"
                      value={formData.invoice_series}
                      onChange={(e) => setFormData({ ...formData, invoice_series: e.target.value })}
                      placeholder="001"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invoice_key">Chave de Acesso</Label>
                  <Input
                    id="invoice_key"
                    value={formData.invoice_key}
                    onChange={(e) => setFormData({ ...formData, invoice_key: e.target.value })}
                    placeholder="44 dígitos"
                    maxLength={44}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">Data de Emissão *</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_value">Valor Total</Label>
                    <Input
                      id="total_value"
                      type="number"
                      step="0.01"
                      value={formData.total_value}
                      onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Fornecedor</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Alert when month is NOT closed */}
                {!closedMonth && formData.issue_date && (
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      O mês {String(selectedMonth).padStart(2, '0')}/{selectedYear} ainda não foi fechado. Faça o fechamento dos cupons antes de cadastrar a nota fiscal.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Info when month IS closed but no supplier selected yet */}
                {closedMonth && formData.issue_date && !formData.supplier_id && (
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      Mês {String(selectedMonth).padStart(2, '0')}/{selectedYear} fechado em {format(new Date(closedMonth.closed_at), 'dd/MM/yyyy', { locale: ptBR })}.
                      Selecione o fornecedor para ver o valor do fechamento.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Info about supplier fechamento total when month IS closed */}
                {closedMonth && formData.supplier_id && formData.issue_date && (
                  <Alert className={
                    supplierFechamentoTotal === 0 
                      ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
                      : hasValueMismatch 
                        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" 
                        : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                  }>
                    {supplierFechamentoTotal === 0 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    ) : hasValueMismatch ? (
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    <AlertDescription className={
                      supplierFechamentoTotal === 0 
                        ? "text-amber-800 dark:text-amber-200"
                        : hasValueMismatch 
                          ? "text-red-800 dark:text-red-200" 
                          : "text-green-800 dark:text-green-200"
                    }>
                      <div className="space-y-1">
                        {supplierFechamentoTotal === 0 ? (
                          <p>
                            Este fornecedor não possui cupons lançados no fechamento de {String(selectedMonth).padStart(2, '0')}/{selectedYear}.
                          </p>
                        ) : (
                          <>
                            <p>
                              <strong>Valor do fechamento ({String(selectedMonth).padStart(2, '0')}/{selectedYear}):</strong> {formatCurrency(supplierFechamentoTotal)}
                            </p>
                            {formData.total_value && hasValueMismatch && (
                              <p className="font-medium">
                                ⚠️ O valor informado ({formatCurrency(enteredValue)}) não confere com o fechamento!
                              </p>
                            )}
                            {formData.total_value && !hasValueMismatch && enteredValue > 0 && (
                              <p className="font-medium">
                                ✓ Valor confere com o fechamento
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label>Anexo (PDF/Imagem)</Label>
                  {selectedFile ? (
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedFile(null)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para selecionar arquivo</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG ou WEBP (máx. 10MB)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais"
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createStandaloneInvoice.isPending || updateInvoice.isPending || isUploading}>
                    {(createStandaloneInvoice.isPending || updateInvoice.isPending || isUploading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isUploading ? 'Enviando...' : (createStandaloneInvoice.isPending || updateInvoice.isPending) ? 'Salvando...' : editingInvoice ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{invoices?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(invoices?.reduce((sum, inv) => sum + (inv.total_value || 0), 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Com Anexo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {invoices?.filter(inv => inv.pdf_url).length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma nota fiscal encontrada</div>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{invoice.invoice_number}</span>
                      {invoice.invoice_series && (
                        <Badge variant="outline" className="text-xs">
                          Série {invoice.invoice_series}
                        </Badge>
                      )}
                      {invoice.pdf_url && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <FileText className="h-3 w-3" />
                          Anexado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {(invoice.supplier as any)?.name || 'Sem fornecedor'}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(invoice.total_value)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(invoice)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {invoice.pdf_url && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setPreviewUrl(getProxyUrl(invoice.pdf_url)); setPreviewInvoiceId(invoice.id); }}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a href={getProxyUrl(invoice.pdf_url, true) || '#'} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingInvoiceId(invoice.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <Card className="hidden md:block">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Anexo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma nota fiscal encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {invoice.invoice_number}
                          {invoice.invoice_series && (
                            <Badge variant="outline" className="text-xs">
                              Série {invoice.invoice_series}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(invoice.supplier as any)?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.total_value)}
                      </TableCell>
                      <TableCell>
                        {invoice.pdf_url ? (
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="h-3 w-3" />
                            Anexado
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(invoice)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {invoice.pdf_url && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setPreviewUrl(getProxyUrl(invoice.pdf_url)); setPreviewInvoiceId(invoice.id); }}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                title="Download"
                              >
                                <a href={getProxyUrl(invoice.pdf_url, true) || '#'} download>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingInvoiceId(invoice.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">
                Visualização do Anexo
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-[60vh] overflow-hidden flex flex-col">
              {previewUrl && (
                <div className="h-full w-full flex flex-col gap-3 flex-1">
                  {previewLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando anexo...
                      </div>
                    </div>
                  ) : previewObjectUrl ? (
                    (previewMime || '').startsWith('image/') ? (
                      <img
                        src={previewObjectUrl}
                        alt="Anexo da nota fiscal"
                        className="w-full flex-1 object-contain rounded-lg max-h-[55vh]"
                        loading="lazy"
                      />
                    ) : (
                      <PdfInlineViewer fileUrl={previewObjectUrl} className="flex-1" />
                    )
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      Não foi possível carregar o anexo.
                    </div>
                  )}

                  <div className="flex justify-center gap-2 py-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <Eye className="h-4 w-4" />
                      Abrir em nova aba
                    </Button>
                    {previewInvoiceId && (
                      <Button
                        type="button"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => {
                          setPreviewUrl(null);
                          setPreviewInvoiceId(null);
                          setDeletingInvoiceId(previewInvoiceId);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir Nota
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingInvoiceId} onOpenChange={(open) => !open && setDeletingInvoiceId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteInvoice.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
