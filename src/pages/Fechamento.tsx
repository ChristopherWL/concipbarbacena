import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  ArrowLeft, 
  Building2, 
  Receipt, 
  Lock,
  Unlock,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Trash2,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Fechamento() {
  const { tenant } = useAuthContext();
  const { isReadOnly } = useDirectorBranch();
  const queryClient = useQueryClient();
  const { data: suppliers = [] } = useSuppliers();
  
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [isClosingDialogOpen, setIsClosingDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [confirmClosingStep, setConfirmClosingStep] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null);
  const [isCouponDetailsOpen, setIsCouponDetailsOpen] = useState(false);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [supplierSearch, setSupplierSearch] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  
  const [couponForm, setCouponForm] = useState({
    supplier_id: '',
    invoice_number: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    total_value: '',
    notes: '',
  });

  // Fetch all closed suppliers for this month/year
  const { data: closedSuppliers = [] } = useQuery({
    queryKey: ['fechamentos_mensais', tenant?.id, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase
        .from('fechamentos_mensais')
        .select('*, supplier:suppliers(id, name)')
        .eq('tenant_id', tenant.id)
        .eq('reference_month', selectedMonth)
        .eq('reference_year', selectedYear);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Check if a specific supplier is closed
  const isSupplierClosed = (supplierId: string) => {
    return closedSuppliers.some((f: any) => f.supplier_id === supplierId);
  };

  // Get closed record for a supplier
  const getClosedRecord = (supplierId: string) => {
    return closedSuppliers.find((f: any) => f.supplier_id === supplierId);
  };

  // Get discount value for a supplier
  const getSupplierDiscount = (supplierId: string): number => {
    const record = getClosedRecord(supplierId);
    return record?.discount_value || 0;
  };

  // Check if selected supplier is closed
  const isSelectedSupplierClosed = selectedSupplier ? isSupplierClosed(selectedSupplier) : false;
  const selectedSupplierDiscount = selectedSupplier ? getSupplierDiscount(selectedSupplier) : 0;

  // Fetch fiscal coupons from fiscal_coupons table (NOT invoices)
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['fiscal_coupons', tenant?.id, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      const { data, error } = await supabase
        .from('fiscal_coupons')
        .select(`
          id,
          coupon_number,
          total_value,
          issue_date,
          notes,
          created_at,
          supplier:suppliers(id, name, cnpj)
        `)
        .eq('tenant_id', tenant.id)
        .gte('issue_date', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`)
        .lt('issue_date', selectedMonth === 12 
          ? `${selectedYear + 1}-01-01` 
          : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
        )
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Create coupon mutation - now uses fiscal_coupons table
  const createCoupon = useMutation({
    mutationFn: async (data: typeof couponForm) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      
      const { error } = await supabase
        .from('fiscal_coupons')
        .insert({
          tenant_id: tenant.id,
          supplier_id: data.supplier_id || null,
          coupon_number: data.invoice_number,
          issue_date: data.issue_date,
          total_value: parseFloat(data.total_value) || 0,
          notes: data.notes || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_coupons'] });
      toast.success('Cupom lançado com sucesso!');
      setIsCouponDialogOpen(false);
      setCouponForm({
        supplier_id: '',
        invoice_number: '',
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        total_value: '',
        notes: '',
      });
    },
    onError: (error) => {
      toast.error('Erro ao lançar cupom: ' + error.message);
    },
  });

  const handleCreateCoupon = () => {
    if (!couponForm.supplier_id) {
      toast.error('Selecione o fornecedor');
      return;
    }
    if (!couponForm.total_value) {
      toast.error('Preencha o valor do cupom');
      return;
    }
    if (isSupplierClosed(couponForm.supplier_id)) {
      toast.error('Este mês já está fechado. Não é possível lançar novos cupons.');
      return;
    }
    createCoupon.mutate(couponForm);
  };

  // Close supplier month mutation
  const closeSupplierMonth = useMutation({
    mutationFn: async (supplierId: string) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      
      const supplierData = supplierGroups.find(g => g.supplier.id === supplierId);
      if (!supplierData) throw new Error('Fornecedor não encontrado');
      
      const { error } = await supabase
        .from('fechamentos_mensais')
        .insert({
          tenant_id: tenant.id,
          supplier_id: supplierId,
          reference_month: selectedMonth,
          reference_year: selectedYear,
          total_value: supplierData.total,
          coupons_count: supplierData.coupons.length,
        });
      
      if (error) throw error;
      return supplierData;
    },
    onSuccess: (supplierData) => {
      queryClient.invalidateQueries({ queryKey: ['fechamentos_mensais'] });
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      toast.success(`Fornecedor fechado com sucesso!`, {
        description: `${supplierData.supplier.name} - ${monthName}/${selectedYear} - ${formatCurrency(supplierData.total)}`,
        duration: 5000,
      });
      setIsClosingDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao fechar fornecedor: ' + error.message);
    },
  });

  const handleCloseSupplier = () => {
    if (!selectedSupplier) {
      toast.error('Selecione um fornecedor para fechar.');
      return;
    }
    if (isSelectedSupplierClosed) {
      toast.error('Este fornecedor já está fechado neste mês.');
      return;
    }
    closeSupplierMonth.mutate(selectedSupplier);
  };

  // Reopen supplier month mutation
  const reopenSupplierMonth = useMutation({
    mutationFn: async (supplierId: string) => {
      const closedRecord = getClosedRecord(supplierId);
      if (!tenant?.id || !closedRecord?.id) throw new Error('Fechamento não encontrado');
      
      const { error } = await supabase
        .from('fechamentos_mensais')
        .delete()
        .eq('id', closedRecord.id);
      
      if (error) throw error;
      return supplierId;
    },
    onSuccess: (supplierId) => {
      queryClient.invalidateQueries({ queryKey: ['fechamentos_mensais'] });
      const supplierData = supplierGroups.find(g => g.supplier.id === supplierId);
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      toast.success(`Fornecedor reaberto com sucesso!`, {
        description: `${supplierData?.supplier.name || 'Fornecedor'} - ${monthName}/${selectedYear} está disponível para novos lançamentos.`,
      });
      setIsReopenDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao reabrir fornecedor: ' + error.message);
    },
  });

  // Delete coupon mutation
  const deleteCoupon = useMutation({
    mutationFn: async (couponId: string) => {
      const { error } = await supabase
        .from('fiscal_coupons')
        .delete()
        .eq('id', couponId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_coupons'] });
      toast.success('Cupom excluído com sucesso!');
      setIsCouponDetailsOpen(false);
      setSelectedCoupon(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir cupom: ' + error.message);
    },
  });

  // Update discount mutation
  const updateDiscount = useMutation({
    mutationFn: async ({ supplierId, discount }: { supplierId: string; discount: number }) => {
      const closedRecord = getClosedRecord(supplierId);
      if (!closedRecord?.id) throw new Error('Fornecedor não está fechado');
      
      const { error } = await supabase
        .from('fechamentos_mensais')
        .update({ discount_value: discount })
        .eq('id', closedRecord.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fechamentos_mensais'] });
      toast.success('Desconto atualizado com sucesso!');
      setIsDiscountDialogOpen(false);
      setDiscountValue('');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar desconto: ' + error.message);
    },
  });

  const handleOpenDiscountDialog = () => {
    if (selectedSupplier) {
      const currentDiscount = getSupplierDiscount(selectedSupplier);
      setDiscountValue(currentDiscount > 0 ? String(currentDiscount) : '');
      setIsDiscountDialogOpen(true);
    }
  };

  const handleSaveDiscount = () => {
    if (!selectedSupplier) return;
    const discount = parseFloat(discountValue) || 0;
    updateDiscount.mutate({ supplierId: selectedSupplier, discount });
  };

  const supplierGroups = useMemo(() => {
    if (!coupons) return [];
    
    const groups: Record<string, { supplier: any; coupons: any[]; total: number }> = {};
    
    for (const coupon of coupons) {
      // Skip coupons without supplier
      if (!(coupon.supplier as any)?.id) continue;
      
      const supplierId = (coupon.supplier as any).id;
      
      if (!groups[supplierId]) {
        groups[supplierId] = {
          supplier: coupon.supplier,
          coupons: [],
          total: 0,
        };
      }
      
      groups[supplierId].coupons.push(coupon);
      groups[supplierId].total += coupon.total_value || 0;
    }
    
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [coupons]);

  const totalValue = useMemo(() => 
    supplierGroups.reduce((sum, g) => sum + g.total, 0),
    [supplierGroups]
  );

  const selectedSupplierData = useMemo(() => 
    supplierGroups.find(g => g.supplier.id === selectedSupplier),
    [supplierGroups, selectedSupplier]
  );

  // Paginação para a tabela de fornecedores (tabela principal)
  const {
    currentPage: suppliersPage,
    setCurrentPage: setSuppliersPage,
    pageSize: suppliersPageSize,
    setPageSize: setSuppliersPageSize,
    paginatedItems: paginatedSuppliers,
    totalItems: totalSuppliers,
  } = usePagination(supplierGroups, 10);

  // Filtro de fornecedores por pesquisa
  const filteredSupplierGroups = useMemo(() => {
    if (!supplierSearch.trim()) return supplierGroups;
    return supplierGroups.filter(g => 
      g.supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
    );
  }, [supplierGroups, supplierSearch]);

  // Paginação para a lista de fornecedores na sidebar
  const {
    currentPage: sidebarSuppliersPage,
    setCurrentPage: setSidebarSuppliersPage,
    pageSize: sidebarSuppliersPageSize,
    setPageSize: setSidebarSuppliersPageSize,
    paginatedItems: paginatedSidebarSuppliers,
    totalItems: totalSidebarSuppliers,
  } = usePagination(filteredSupplierGroups, 10);

  // Paginação para a tabela de cupons do fornecedor selecionado
  const selectedSupplierCoupons = selectedSupplierData?.coupons || [];
  const {
    currentPage: couponsPage,
    setCurrentPage: setCouponsPage,
    pageSize: couponsPageSize,
    setPageSize: setCouponsPageSize,
    paginatedItems: paginatedCoupons,
    totalItems: totalCoupons,
  } = usePagination(selectedSupplierCoupons, 10);

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const parseDateOnly = (dateStr: string) => {
    const safe = (dateStr || '').slice(0, 10); // yyyy-MM-dd
    const [y, m, d] = safe.split('-').map((n) => Number(n));
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <PageHeader
          title="Fechamento Mensal"
          description="Cupons fiscais mensais por fornecedor"
        />

        {/* Summary Card */}
        <div 
          className="relative overflow-hidden rounded-2xl p-8 sm:p-10 bg-sidebar text-sidebar-foreground shadow-xl"
        >
          {/* Card Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-48 h-48 rounded-full border-[28px] border-sidebar-primary/30" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full border-[28px] border-sidebar-primary/20" />
          </div>
          
          {/* Card Content */}
          <div className="relative z-10">
            {selectedSupplier ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    isSelectedSupplierClosed 
                      ? 'bg-green-500/20' 
                      : 'bg-sidebar-primary/20'
                  }`}>
                    {isSelectedSupplierClosed ? (
                      <Lock className="h-8 w-8 text-green-400" />
                    ) : (
                      <Building2 className="h-8 w-8 text-sidebar-primary" />
                    )}
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${
                      isSelectedSupplierClosed 
                        ? 'text-green-400 font-semibold' 
                        : 'text-sidebar-foreground/60'
                    }`}>
                      {isSelectedSupplierClosed ? 'FECHADO' : 'Fornecedor'}
                    </p>
                    <p className="text-xl font-semibold">
                      {selectedSupplierData?.supplier.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 sm:gap-10">
                  <div className="text-center">
                    <p className="text-xs text-sidebar-foreground/60">Notas</p>
                    <p className="text-3xl font-bold text-sidebar-primary">
                      {selectedSupplierData?.coupons.length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-sidebar-foreground/60">Total</p>
                    <p className="text-2xl font-bold text-sidebar-primary">
                      {formatCurrency(selectedSupplierData?.total)}
                    </p>
                  </div>
                  {isSelectedSupplierClosed && (
                    <>
                      <div className="text-center">
                        <p className="text-xs text-sidebar-foreground/60">Desconto</p>
                        <p className="text-2xl font-bold text-orange-400">
                          {selectedSupplierDiscount > 0 ? `- ${formatCurrency(selectedSupplierDiscount)}` : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-sidebar-foreground/60">Líquido</p>
                        <p className="text-3xl font-bold text-green-400">
                          {formatCurrency((selectedSupplierData?.total || 0) - selectedSupplierDiscount)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
                    <Receipt className="h-10 w-10 text-sidebar-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-sidebar-foreground/60">
                      Fechamento
                    </p>
                    <p className="text-2xl font-semibold">
                      {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
                    </p>
                    {closedSuppliers.length > 0 && (
                      <p className="text-xs text-green-400 mt-1">
                        {closedSuppliers.length} fornecedor(es) fechado(s)
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-sidebar-foreground/60">Total Geral</p>
                  <p className="text-4xl sm:text-5xl font-bold text-sidebar-primary">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Period Selector + Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select
              value={String(selectedMonth)}
              onValueChange={(v) => {
                setSelectedMonth(Number(v));
                setSelectedSupplier(null);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => {
                setSelectedYear(Number(v));
                setSelectedSupplier(null);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isReadOnly && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedSupplier && isSelectedSupplierClosed && (
                <Badge 
                  variant="secondary" 
                  className="bg-green-100 text-green-700 border-green-300 cursor-pointer hover:bg-green-200 transition-colors"
                  onClick={() => setIsReopenDialogOpen(true)}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Fornecedor Fechado
                </Badge>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  if (selectedSupplier) {
                    setCouponForm(prev => ({ ...prev, supplier_id: selectedSupplier }));
                  }
                  setIsCouponDialogOpen(true);
                }}
                disabled={selectedSupplier ? isSelectedSupplierClosed : false}
              >
                <Plus className="h-4 w-4 mr-2" />
                Lançar Cupom
              </Button>
              {selectedSupplier && !isSelectedSupplierClosed && (
                <Button onClick={() => setIsClosingDialogOpen(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Fechar Fornecedor
                </Button>
              )}
              {selectedSupplier && isSelectedSupplierClosed && (
                <Button variant="outline" onClick={handleOpenDiscountDialog}>
                  <Percent className="h-4 w-4 mr-2" />
                  Desconto
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Main Layout with Supplier Sidebar */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Sidebar - Supplier List */}
          <div className="lg:w-64 shrink-0">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-3 border-b bg-muted/50 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Fornecedores</p>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar"
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      className="h-6 w-24 pl-6 text-xs"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[350px] lg:h-[400px]">
                  <div className="p-2 space-y-1">
                    {/* All option */}
                    <button
                      onClick={() => setSelectedSupplier(null)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                        !selectedSupplier 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        <span className="text-sm font-medium">Todos</span>
                      </div>
                      <span className="text-xs opacity-80">
                        {formatCurrency(totalValue)}
                      </span>
                    </button>

                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : supplierGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum fornecedor
                      </p>
                    ) : (
                      <>
                        {paginatedSidebarSuppliers.map((group) => {
                          const isClosed = isSupplierClosed(group.supplier.id);
                          return (
                            <button
                              key={group.supplier.id}
                              onClick={() => setSelectedSupplier(group.supplier.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                                selectedSupplier === group.supplier.id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : isClosed
                                    ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                                    : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isClosed ? (
                                  <Lock className={`h-4 w-4 shrink-0 ${selectedSupplier === group.supplier.id ? '' : 'text-green-600 dark:text-green-400'}`} />
                                ) : (
                                  <Building2 className="h-4 w-4 shrink-0" />
                                )}
                                <span className="text-sm font-medium truncate">
                                  {group.supplier.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 ml-2 shrink-0">
                                {isClosed && selectedSupplier !== group.supplier.id && (
                                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs px-1">
                                    Fechado
                                  </Badge>
                                )}
                                <Badge 
                                  variant={selectedSupplier === group.supplier.id ? "secondary" : "outline"} 
                                  className="shrink-0"
                                >
                                  {group.coupons.length}
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Paginação fixa no final do card */}
                {totalSidebarSuppliers > 0 && (
                  <div className="flex items-center justify-center gap-1 p-3 border-t bg-background">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSidebarSuppliersPage(1)}
                      disabled={sidebarSuppliersPage <= 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSidebarSuppliersPage(Math.max(1, sidebarSuppliersPage - 1))}
                      disabled={sidebarSuppliersPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {sidebarSuppliersPage} / {Math.ceil(totalSidebarSuppliers / sidebarSuppliersPageSize) || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSidebarSuppliersPage(Math.min(Math.ceil(totalSidebarSuppliers / sidebarSuppliersPageSize), sidebarSuppliersPage + 1))}
                      disabled={sidebarSuppliersPage >= Math.ceil(totalSidebarSuppliers / sidebarSuppliersPageSize)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSidebarSuppliersPage(Math.ceil(totalSidebarSuppliers / sidebarSuppliersPageSize))}
                      disabled={sidebarSuppliersPage >= Math.ceil(totalSidebarSuppliers / sidebarSuppliersPageSize)}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Table */}
          <div className="flex-1">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] lg:h-[400px]">
                  {selectedSupplier ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="hidden sm:table-cell">Obs.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCoupons.map((coupon: any) => (
                          <TableRow 
                            key={coupon.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setIsCouponDetailsOpen(true);
                            }}
                          >
                            <TableCell className="font-medium">
                              {coupon.coupon_number}
                            </TableCell>
                            <TableCell>
                              {format(parseDateOnly(coupon.issue_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(coupon.total_value)}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">
                              {coupon.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
                          <TableHead className="text-center">Notas</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                            </TableCell>
                          </TableRow>
                        ) : supplierGroups.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Nenhum lançamento no período
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedSuppliers.map((group) => (
                            <TableRow 
                              key={group.supplier.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                setSelectedSupplier(group.supplier.id);
                                setCouponsPage(1);
                              }}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  {group.supplier.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground hidden sm:table-cell">
                                {group.supplier.cnpj || '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">
                                  {group.coupons.length}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-primary">
                                {formatCurrency(group.total)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
                
                {/* Paginação */}
                {selectedSupplier ? (
                  totalCoupons > 0 && (
                    <TablePagination
                      currentPage={couponsPage}
                      totalItems={totalCoupons}
                      pageSize={couponsPageSize}
                      onPageChange={setCouponsPage}
                      onPageSizeChange={setCouponsPageSize}
                      className="px-4 border-t"
                    />
                  )
                ) : (
                  totalSuppliers > 0 && (
                    <TablePagination
                      currentPage={suppliersPage}
                      totalItems={totalSuppliers}
                      pageSize={suppliersPageSize}
                      onPageChange={setSuppliersPage}
                      onPageSizeChange={setSuppliersPageSize}
                      className="px-4 border-t"
                    />
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Coupon Dialog */}
        <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
          <DialogContent className="max-w-md mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Lançar Cupom</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                Registre um novo cupom fiscal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Fornecedor *</Label>
                <Select
                  value={couponForm.supplier_id}
                  onValueChange={(v) => setCouponForm({ ...couponForm, supplier_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número do Cupom</Label>
                  <Input
                    placeholder="Ex: 001234"
                    value={couponForm.invoice_number}
                    onChange={(e) => setCouponForm({ ...couponForm, invoice_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={couponForm.issue_date}
                    onChange={(e) => setCouponForm({ ...couponForm, issue_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={couponForm.total_value}
                  onChange={(e) => setCouponForm({ ...couponForm, total_value: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações sobre o cupom..."
                  value={couponForm.notes}
                  onChange={(e) => setCouponForm({ ...couponForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCouponDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCoupon} disabled={createCoupon.isPending}>
                {createCoupon.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Closing Dialog */}
        <Dialog open={isClosingDialogOpen} onOpenChange={(open) => {
          setIsClosingDialogOpen(open);
          if (!open) setConfirmClosingStep(false);
        }}>
          <DialogContent className="max-w-lg mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">
                {confirmClosingStep ? 'Confirmar Fechamento' : 'Fechar Fornecedor'}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {confirmClosingStep ? 'Esta ação não pode ser desfeita facilmente' : 'Confirme o fechamento do fornecedor'}
              </DialogDescription>
            </DialogHeader>
            
            {confirmClosingStep ? (
              <div className="py-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-lg font-semibold">
                    Tem certeza que deseja fechar este fornecedor?
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    {selectedSupplierData?.supplier.name} - {months.find(m => m.value === selectedMonth)?.label}/{selectedYear}
                  </p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {formatCurrency(selectedSupplierData?.total)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Após o fechamento, não será possível lançar novos cupons para este fornecedor neste período.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {selectedSupplierData?.supplier.name}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {months.find(m => m.value === selectedMonth)?.label} de {selectedYear} • {selectedSupplierData?.coupons.length || 0} cupons
                  </p>
                </div>
                
                <div className="bg-sidebar rounded-lg p-4 text-center">
                  <p className="text-sm text-sidebar-foreground/60">Total do Fornecedor</p>
                  <p className="text-3xl font-bold text-sidebar-primary">
                    {formatCurrency(selectedSupplierData?.total)}
                  </p>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  Após o fechamento, os dados deste fornecedor no período não poderão ser alterados.
                </p>
              </div>
            )}
            
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => {
                if (confirmClosingStep) {
                  setConfirmClosingStep(false);
                } else {
                  setIsClosingDialogOpen(false);
                }
              }}>
                {confirmClosingStep ? 'Voltar' : 'Cancelar'}
              </Button>
              {confirmClosingStep ? (
                <Button variant="destructive" onClick={handleCloseSupplier} disabled={closeSupplierMonth.isPending}>
                  {closeSupplierMonth.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Lock className="h-4 w-4 mr-2" />
                  Fechar Fornecedor
                </Button>
              ) : (
                <Button onClick={() => setConfirmClosingStep(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Confirmar Fechamento
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reopen Supplier Confirmation Dialog */}
        <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reabrir Fornecedor</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja reabrir {selectedSupplierData?.supplier.name} em {months.find(m => m.value === selectedMonth)?.label}/{selectedYear}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Ao reabrir o fornecedor, será possível lançar novos cupons e fazer alterações nos dados do período.
              </p>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsReopenDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => selectedSupplier && reopenSupplierMonth.mutate(selectedSupplier)}
                disabled={reopenSupplierMonth.isPending}
              >
                {reopenSupplierMonth.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4 mr-2" />
                )}
                Reabrir Fornecedor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Coupon Details Dialog */}
        <Dialog open={isCouponDetailsOpen} onOpenChange={setIsCouponDetailsOpen}>
          <DialogContent className="max-w-md mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Detalhes do Cupom</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                Informações do cupom fiscal
              </DialogDescription>
            </DialogHeader>
            {selectedCoupon && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Número do Cupom</Label>
                    <p className="font-semibold">{selectedCoupon.coupon_number || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Data de Emissão</Label>
                    <p className="font-semibold">
                      {format(parseDateOnly(selectedCoupon.issue_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Fornecedor</Label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{(selectedCoupon.supplier as any)?.name || '-'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">CNPJ do Fornecedor</Label>
                  <p className="font-medium text-muted-foreground">
                    {(selectedCoupon.supplier as any)?.cnpj || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Valor Total</Label>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedCoupon.total_value)}
                  </p>
                </div>

                {selectedCoupon.notes && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Observações</Label>
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      {selectedCoupon.notes}
                    </p>
                  </div>
                )}

                <div className="space-y-1 pt-2 border-t">
                  <Label className="text-muted-foreground text-xs">Data de Cadastro</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedCoupon.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              {selectedCoupon && !isSupplierClosed((selectedCoupon.supplier as any)?.id) && (
                <Button 
                  variant="destructive" 
                  onClick={() => selectedCoupon && deleteCoupon.mutate(selectedCoupon.id)}
                  disabled={deleteCoupon.isPending}
                >
                  {deleteCoupon.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Excluir
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsCouponDetailsOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Discount Dialog */}
        <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
          <DialogContent className="max-w-sm mx-2 sm:mx-auto">
            <DialogHeader className="bg-orange-500 rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-white">Desconto do Fornecedor</DialogTitle>
              <DialogDescription className="text-white/80">
                {selectedSupplierData?.supplier.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Bruto</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedSupplierData?.total)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Valor do Desconto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
              
              {discountValue && parseFloat(discountValue) > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 dark:text-green-400">Valor Líquido</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency((selectedSupplierData?.total || 0) - (parseFloat(discountValue) || 0))}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveDiscount} disabled={updateDiscount.isPending}>
                {updateDiscount.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Desconto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
