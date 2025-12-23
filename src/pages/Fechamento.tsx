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
  const [confirmClosingStep, setConfirmClosingStep] = useState(false);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [couponForm, setCouponForm] = useState({
    supplier_id: '',
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    total_value: '',
    notes: '',
  });

  // Check if month is closed
  const { data: closedMonth } = useQuery({
    queryKey: ['fechamento_mensal', tenant?.id, selectedMonth, selectedYear],
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
    enabled: !!tenant?.id,
  });

  const isMonthClosed = !!closedMonth;

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
        issue_date: new Date().toISOString().split('T')[0],
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
    if (isMonthClosed) {
      toast.error('Este mês já está fechado. Não é possível lançar novos cupons.');
      return;
    }
    createCoupon.mutate(couponForm);
  };

  // Close month mutation
  const closeMonth = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      
      const { error } = await supabase
        .from('fechamentos_mensais')
        .insert({
          tenant_id: tenant.id,
          reference_month: selectedMonth,
          reference_year: selectedYear,
          total_value: totalValue,
          suppliers_count: supplierGroups.length,
          coupons_count: coupons?.length || 0,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fechamento_mensal'] });
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      toast.success(`Mês fechado com sucesso!`, {
        description: `${monthName}/${selectedYear} - Total: ${formatCurrency(totalValue)} (${supplierGroups.length} fornecedores)`,
        duration: 5000,
      });
      setIsClosingDialogOpen(false);
      setShowSupplierDetails(false);
    },
    onError: (error) => {
      toast.error('Erro ao fechar mês: ' + error.message);
    },
  });

  const handleCloseMonth = () => {
    if (isMonthClosed) {
      toast.error('Este mês já está fechado.');
      return;
    }
    closeMonth.mutate();
  };

  // Reopen month mutation
  const reopenMonth = useMutation({
    mutationFn: async () => {
      if (!tenant?.id || !closedMonth?.id) throw new Error('Fechamento não encontrado');
      
      const { error } = await supabase
        .from('fechamentos_mensais')
        .delete()
        .eq('id', closedMonth.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fechamento_mensal'] });
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      toast.success(`Mês reaberto com sucesso!`, {
        description: `${monthName}/${selectedYear} está disponível para novos lançamentos.`,
      });
      setIsReopenDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao reabrir mês: ' + error.message);
    },
  });

  // Group coupons by supplier (excluding items without supplier)
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

  // Paginação para a lista de fornecedores na sidebar
  const {
    currentPage: sidebarSuppliersPage,
    setCurrentPage: setSidebarSuppliersPage,
    pageSize: sidebarSuppliersPageSize,
    setPageSize: setSidebarSuppliersPageSize,
    paginatedItems: paginatedSidebarSuppliers,
    totalItems: totalSidebarSuppliers,
  } = usePagination(supplierGroups, 10);

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
                  <div className="w-16 h-16 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-sidebar-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wide">
                      Fornecedor
                    </p>
                    <p className="text-xl font-semibold">
                      {selectedSupplierData?.supplier.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-10">
                  <div className="text-center">
                    <p className="text-xs text-sidebar-foreground/60">Notas</p>
                    <p className="text-3xl font-bold text-sidebar-primary">
                      {selectedSupplierData?.coupons.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-sidebar-foreground/60">Total</p>
                    <p className="text-4xl font-bold text-sidebar-primary">
                      {formatCurrency(selectedSupplierData?.total)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
                    <Receipt className="h-10 w-10 text-sidebar-primary" />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wider ${isMonthClosed ? 'text-green-400 font-semibold' : 'text-sidebar-foreground/60'}`}>
                      {isMonthClosed ? 'FECHADO' : 'Fechamento'}
                    </p>
                    <p className="text-2xl font-semibold">
                      {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
                    </p>
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
              {isMonthClosed && (
                <Badge 
                  variant="secondary" 
                  className="bg-green-100 text-green-700 border-green-300 cursor-pointer hover:bg-green-200 transition-colors"
                  onClick={() => setIsReopenDialogOpen(true)}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Mês Fechado
                </Badge>
              )}
              <Button 
                variant="outline" 
                onClick={() => setIsCouponDialogOpen(true)}
                disabled={isMonthClosed}
              >
                <Plus className="h-4 w-4 mr-2" />
                Lançar Cupom
              </Button>
              {!isMonthClosed && (
                <Button onClick={() => setIsClosingDialogOpen(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Fechar Mês
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
                <div className="p-3 border-b bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground">Fornecedores</p>
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
                        {paginatedSidebarSuppliers.map((group) => (
                          <button
                            key={group.supplier.id}
                            onClick={() => setSelectedSupplier(group.supplier.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                              selectedSupplier === group.supplier.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="h-4 w-4 shrink-0" />
                              <span className="text-sm font-medium truncate">
                                {group.supplier.name}
                              </span>
                            </div>
                            <Badge 
                              variant={selectedSupplier === group.supplier.id ? "secondary" : "outline"} 
                              className="ml-2 shrink-0"
                            >
                              {group.coupons.length}
                            </Badge>
                          </button>
                        ))}
                        
                        {/* Paginação inline */}
                        {totalSidebarSuppliers > 10 && (
                          <div className="flex items-center justify-center gap-2 pt-2 mt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setSidebarSuppliersPage(Math.max(1, sidebarSuppliersPage - 1))}
                              disabled={sidebarSuppliersPage <= 1}
                            >
                              <ChevronLeft className="h-3 w-3 mr-1" />
                              Anterior
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {sidebarSuppliersPage}/{Math.ceil(totalSidebarSuppliers / sidebarSuppliersPageSize)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setSidebarSuppliersPage(Math.min(Math.ceil(totalSidebarSuppliers / sidebarSuppliersPageSize), sidebarSuppliersPage + 1))}
                              disabled={sidebarSuppliersPage >= Math.ceil(totalSidebarSuppliers / sidebarSuppliersPageSize)}
                            >
                              Próxima
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
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
                          <TableRow key={coupon.id}>
                            <TableCell className="font-medium">
                              {coupon.coupon_number}
                            </TableCell>
                            <TableCell>
                              {format(new Date(coupon.issue_date), 'dd/MM/yyyy', { locale: ptBR })}
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
                {confirmClosingStep ? 'Confirmar Fechamento' : 'Fechar Mês'}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {confirmClosingStep ? 'Esta ação não pode ser desfeita facilmente' : 'Confirme o fechamento do período'}
              </DialogDescription>
            </DialogHeader>
            
            {confirmClosingStep ? (
              <div className="py-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-lg font-semibold">
                    Tem certeza que deseja fechar o mês?
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    {months.find(m => m.value === selectedMonth)?.label}/{selectedYear} - {formatCurrency(totalValue)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Após o fechamento, não será possível lançar novos cupons neste período.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {supplierGroups.length} fornecedores • {coupons?.length || 0} cupons
                  </p>
                </div>
                
                <div className="bg-sidebar rounded-lg p-4 text-center">
                  <p className="text-sm text-sidebar-foreground/60">Total Geral</p>
                  <p className="text-3xl font-bold text-sidebar-primary">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                
                {/* Supplier List Toggle */}
                {supplierGroups.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowSupplierDetails(!showSupplierDetails)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm font-medium">Detalhes por fornecedor</span>
                      {showSupplierDetails ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    
                    {showSupplierDetails && (
                      <div className="divide-y max-h-[200px] overflow-y-auto">
                        {supplierGroups.map((group) => (
                          <div key={group.supplier.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium truncate">{group.supplier.name}</span>
                              <Badge variant="outline" className="shrink-0">{group.coupons.length}</Badge>
                            </div>
                            <span className="text-sm font-semibold text-primary ml-2">
                              {formatCurrency(group.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground text-center">
                  Após o fechamento, os dados do período não poderão ser alterados.
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
                <Button variant="destructive" onClick={handleCloseMonth} disabled={closeMonth.isPending}>
                  {closeMonth.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Lock className="h-4 w-4 mr-2" />
                  Fechar Mês
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

        {/* Reopen Month Confirmation Dialog */}
        <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reabrir Mês</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja reabrir {months.find(m => m.value === selectedMonth)?.label}/{selectedYear}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Ao reabrir o mês, será possível lançar novos cupons e fazer alterações nos dados do período.
              </p>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsReopenDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => reopenMonth.mutate()}
                disabled={reopenMonth.isPending}
              >
                {reopenMonth.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4 mr-2" />
                )}
                Reabrir Mês
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
