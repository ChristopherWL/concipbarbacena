import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Search, Download, AlertTriangle, CheckCircle, XCircle, FileText, 
  ArrowDownCircle, ArrowUpCircle, Package, Calendar, Filter,
  TrendingUp, TrendingDown, BarChart3, RefreshCw, Printer
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';
import { exportRelatorioInventario, exportFichaControleSaidaMaterial, BranchInfo } from '@/lib/exportRelatorioPDF';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

type ReportType = 'total' | 'entradas' | 'saidas';
type DateRange = 'today' | 'week' | 'month' | 'custom';

export function RelatorioInventario() {
  const [activeTab, setActiveTab] = useState<ReportType>('total');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: movements = [], isLoading: loadingMovements } = useStockMovements();
  const { tenant, selectedBranch } = useAuth();

  // Calculate date range
  const dateInterval = useMemo(() => {
    const today = new Date();
    switch (dateRange) {
      case 'today':
        return { start: today, end: today };
      case 'week':
        return { start: startOfWeek(today, { locale: ptBR }), end: endOfWeek(today, { locale: ptBR }) };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'custom':
        return { start: parseISO(customStartDate), end: parseISO(customEndDate) };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  }, [dateRange, customStartDate, customEndDate]);

  // Filter movements by date and type
  const filteredMovements = useMemo(() => {
    return movements.filter(mov => {
      const movDate = parseISO(mov.created_at);
      const inDateRange = isWithinInterval(movDate, dateInterval);
      
      const matchesSearch = !searchTerm || 
        mov.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.product?.code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || mov.product?.category === categoryFilter;
      
      return inDateRange && matchesSearch && matchesCategory;
    });
  }, [movements, dateInterval, searchTerm, categoryFilter]);

  // Separate entries and exits
  const entradas = useMemo(() => 
    filteredMovements.filter(m => m.movement_type === 'entrada' || m.movement_type === 'devolucao'),
    [filteredMovements]
  );

  const saidas = useMemo(() => 
    filteredMovements.filter(m => m.movement_type === 'saida' || m.movement_type === 'transferencia'),
    [filteredMovements]
  );

  // Filter products for total inventory
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'critical') {
        matchesStock = (product.current_stock || 0) <= (product.min_stock || 0);
      } else if (stockFilter === 'low') {
        matchesStock = (product.current_stock || 0) <= (product.min_stock || 0) * 1.5 && 
                       (product.current_stock || 0) > (product.min_stock || 0);
      } else if (stockFilter === 'ok') {
        matchesStock = (product.current_stock || 0) > (product.min_stock || 0) * 1.5;
      } else if (stockFilter === 'zero') {
        matchesStock = (product.current_stock || 0) === 0;
      }
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  // Stats calculations
  const stats = useMemo(() => {
    const totalProducts = filteredProducts.length;
    const totalStock = filteredProducts.reduce((acc, p) => acc + (p.current_stock || 0), 0);
    const totalValue = filteredProducts.reduce((acc, p) => acc + ((p.current_stock || 0) * (p.cost_price || 0)), 0);
    const criticalCount = filteredProducts.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length;
    
    const totalEntradas = entradas.reduce((acc, m) => acc + m.quantity, 0);
    const totalSaidas = saidas.reduce((acc, m) => acc + m.quantity, 0);
    const valorEntradas = entradas.reduce((acc, m) => acc + (m.quantity * (m.product?.cost_price || 0)), 0);
    const valorSaidas = saidas.reduce((acc, m) => acc + (m.quantity * (m.product?.cost_price || 0)), 0);

    return {
      totalProducts,
      totalStock,
      totalValue,
      criticalCount,
      totalEntradas,
      totalSaidas,
      valorEntradas,
      valorSaidas,
      entradasCount: entradas.length,
      saidasCount: saidas.length,
    };
  }, [filteredProducts, entradas, saidas]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      epi: 'EPI',
      epc: 'EPC',
      ferramentas: 'Ferramentas',
      materiais: 'Materiais',
      equipamentos: 'Equipamentos',
    };
    return labels[category] || category;
  };

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Zerado</Badge>;
    }
    if (quantity <= minStock) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Crítico</Badge>;
    }
    if (quantity <= minStock * 1.5) {
      return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" /> Baixo</Badge>;
    }
    return <Badge variant="outline" className="gap-1 text-green-600 border-green-600"><CheckCircle className="h-3 w-3" /> OK</Badge>;
  };

  const getMovementTypeBadge = (type: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof ArrowDownCircle }> = {
      entrada: { label: 'Entrada', variant: 'default', icon: ArrowDownCircle },
      saida: { label: 'Saída', variant: 'destructive', icon: ArrowUpCircle },
      transferencia: { label: 'Transferência', variant: 'secondary', icon: RefreshCw },
      devolucao: { label: 'Devolução', variant: 'outline', icon: ArrowDownCircle },
      ajuste: { label: 'Ajuste', variant: 'outline', icon: RefreshCw },
    };
    const c = config[type] || { label: type, variant: 'outline', icon: Package };
    const Icon = c.icon;
    return <Badge variant={c.variant} className="gap-1"><Icon className="h-3 w-3" /> {c.label}</Badge>;
  };

  const getCompanyInfo = () => ({
    name: tenant?.name || 'Empresa',
    cnpj: tenant?.cnpj,
    address: tenant?.address,
    city: tenant?.city,
    state: tenant?.state,
    phone: tenant?.phone,
    email: tenant?.email,
  });

  const getBranchInfo = (): BranchInfo | null => {
    if (!selectedBranch) return null;
    return {
      name: selectedBranch.name,
      cnpj: selectedBranch.cnpj || undefined,
      address: selectedBranch.address || undefined,
      number: selectedBranch.number || undefined,
      neighborhood: selectedBranch.neighborhood || undefined,
      city: selectedBranch.city || undefined,
      state: selectedBranch.state || undefined,
      zip_code: selectedBranch.zip_code || undefined,
      phone: selectedBranch.phone || undefined,
      email: selectedBranch.email || undefined,
      logo_url: selectedBranch.logo_url || undefined,
      logo_dark_url: selectedBranch.logo_dark_url || undefined,
    };
  };

  // Export functions
  const exportTotalPDF = () => {
    exportRelatorioInventario(getCompanyInfo(), filteredProducts, formatCurrency);
  };

  const exportMovementsPDF = (type: 'entradas' | 'saidas') => {
    const data = type === 'entradas' ? entradas : saidas;
    const title = type === 'entradas' ? 'Relatório de Entradas' : 'Relatório de Saídas';
    
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text(tenant?.name || 'Empresa', pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(14);
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Period
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const periodText = `Período: ${format(dateInterval.start, 'dd/MM/yyyy')} a ${format(dateInterval.end, 'dd/MM/yyyy')}`;
    doc.text(periodText, pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(9);
    doc.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;

    // Summary
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 95);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo:', 15, y);
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const totalQty = data.reduce((acc, m) => acc + m.quantity, 0);
    const totalVal = data.reduce((acc, m) => acc + (m.quantity * (m.product?.cost_price || 0)), 0);
    doc.text(`Total de movimentações: ${data.length}`, 15, y);
    doc.text(`Quantidade total: ${totalQty} itens`, 100, y);
    doc.text(`Valor total: ${formatCurrency(totalVal)}`, 200, y);
    y += 10;

    // Table header
    const columns = [
      { header: 'Data/Hora', width: 35 },
      { header: 'Produto', width: 60 },
      { header: 'Código', width: 25 },
      { header: 'Categoria', width: 25 },
      { header: 'Tipo', width: 25 },
      { header: 'Quantidade', width: 25, align: 'center' as const },
      { header: 'Motivo', width: 50 },
      { header: 'Valor', width: 25, align: 'right' as const },
    ];

    doc.setFillColor(30, 58, 95);
    doc.rect(15, y, pageWidth - 30, 8, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    
    let x = 17;
    columns.forEach(col => {
      doc.text(col.header, x, y + 5.5);
      x += col.width;
    });
    y += 10;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7);

    const pageHeight = doc.internal.pageSize.getHeight();
    
    data.forEach((mov, index) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
        
        doc.setFillColor(30, 58, 95);
        doc.rect(15, y, pageWidth - 30, 8, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        
        x = 17;
        columns.forEach(col => {
          doc.text(col.header, x, y + 5.5);
          x += col.width;
        });
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(7);
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 1, pageWidth - 30, 6, 'F');
      }

      x = 17;
      const rowData = [
        format(parseISO(mov.created_at), 'dd/MM/yy HH:mm'),
        (mov.product?.name || '-').substring(0, 28),
        (mov.product?.code || '-').substring(0, 10),
        getCategoryLabel(mov.product?.category || ''),
        mov.movement_type,
        mov.quantity.toString(),
        (mov.reason || '-').substring(0, 25),
        formatCurrency(mov.quantity * (mov.product?.cost_price || 0)),
      ];

      rowData.forEach((text, colIndex) => {
        const col = columns[colIndex];
        if (col.align === 'right') {
          doc.text(text, x + col.width - 2, y + 3, { align: 'right' });
        } else if (col.align === 'center') {
          doc.text(text, x + col.width / 2, y + 3, { align: 'center' });
        } else {
          doc.text(text, x, y + 3);
        }
        x += col.width;
      });

      y += 6;
    });

    doc.save(`relatorio_${type}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = (type: ReportType) => {
    let data: any[];
    let headers: string[];
    let filename: string;

    if (type === 'total') {
      headers = ['Código', 'Nome', 'Categoria', 'Quantidade', 'Estoque Mín.', 'Status', 'Valor Unit.', 'Valor Total'];
      data = filteredProducts.map(p => [
        p.code || '-',
        p.name,
        getCategoryLabel(p.category),
        p.current_stock || 0,
        p.min_stock || 0,
        (p.current_stock || 0) <= (p.min_stock || 0) ? 'Crítico' : 'OK',
        p.cost_price || 0,
        ((p.current_stock || 0) * (p.cost_price || 0)).toFixed(2),
      ]);
      filename = 'inventario_total';
    } else {
      const movements = type === 'entradas' ? entradas : saidas;
      headers = ['Data', 'Hora', 'Produto', 'Código', 'Categoria', 'Tipo', 'Quantidade', 'Motivo', 'Valor'];
      data = movements.map(m => [
        format(parseISO(m.created_at), 'dd/MM/yyyy'),
        format(parseISO(m.created_at), 'HH:mm'),
        m.product?.name || '-',
        m.product?.code || '-',
        getCategoryLabel(m.product?.category || ''),
        m.movement_type,
        m.quantity,
        m.reason || '-',
        (m.quantity * (m.product?.cost_price || 0)).toFixed(2),
      ]);
      filename = type === 'entradas' ? 'entradas' : 'saidas';
    }
    
    const csvContent = [headers.join(','), ...data.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const isLoading = loadingProducts || loadingMovements;

  return (
    <div className="space-y-4">
      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Relatórios de Inventário
              </CardTitle>
              <CardDescription>Gere relatórios detalhados de entradas, saídas e estoque total</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11">
              <TabsTrigger value="total" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Estoque Total</span>
                <span className="sm:hidden">Total</span>
              </TabsTrigger>
              <TabsTrigger value="entradas" className="gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <ArrowDownCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Entradas</span>
                <span className="sm:hidden">Ent.</span>
              </TabsTrigger>
              <TabsTrigger value="saidas" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <ArrowUpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Saídas</span>
                <span className="sm:hidden">Saí.</span>
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {/* Search */}
                <div className="relative sm:col-span-2 lg:col-span-1 xl:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    <SelectItem value="epi">EPI</SelectItem>
                    <SelectItem value="epc">EPC</SelectItem>
                    <SelectItem value="ferramentas">Ferramentas</SelectItem>
                    <SelectItem value="materiais">Materiais</SelectItem>
                    <SelectItem value="equipamentos">Equipamentos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Stock filter for total tab */}
                {activeTab === 'total' && (
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Situação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ok">✅ OK</SelectItem>
                      <SelectItem value="low">⚠️ Baixo</SelectItem>
                      <SelectItem value="critical">🔴 Crítico</SelectItem>
                      <SelectItem value="zero">❌ Zerado</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Date range for movements */}
                {(activeTab === 'entradas' || activeTab === 'saidas') && (
                  <>
                    <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                      <SelectTrigger>
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Esta semana</SelectItem>
                        <SelectItem value="month">Este mês</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>

                    {dateRange === 'custom' && (
                      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="text-xs"
                        />
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex flex-wrap gap-2 justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(activeTab)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button size="sm" onClick={() => {
                if (activeTab === 'total') exportTotalPDF();
                else exportMovementsPDF(activeTab);
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
            </div>

            {/* Total Stock Tab */}
            <TabsContent value="total" className="mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="hidden md:table-cell text-center">Mín.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhum produto encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-xs">{product.code || '-'}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-medium">{product.current_stock || 0}</TableCell>
                            <TableCell className="hidden md:table-cell text-center text-muted-foreground">
                              {product.min_stock || 0}
                            </TableCell>
                            <TableCell>
                              {getStockStatus(product.current_stock || 0, product.min_stock || 0)}
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell">
                              {formatCurrency((product.current_stock || 0) * (product.cost_price || 0))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground pt-4 border-t">
                <span>{filteredProducts.length} produtos</span>
                <div className="flex gap-4">
                  {stats.criticalCount > 0 && (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {stats.criticalCount} crítico(s)
                    </span>
                  )}
                  <span className="font-medium text-foreground">{formatCurrency(stats.totalValue)}</span>
                </div>
              </div>
            </TabsContent>

            {/* Entradas Tab */}
            <TabsContent value="entradas" className="mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="hidden md:table-cell">Motivo</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entradas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhuma entrada no período
                          </TableCell>
                        </TableRow>
                      ) : (
                        entradas.map((mov) => (
                          <TableRow key={mov.id}>
                            <TableCell className="text-xs">
                              <div>{format(parseISO(mov.created_at), 'dd/MM/yyyy')}</div>
                              <div className="text-muted-foreground">{format(parseISO(mov.created_at), 'HH:mm')}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{mov.product?.name || '-'}</div>
                              <div className="text-xs text-muted-foreground font-mono">{mov.product?.code}</div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{getCategoryLabel(mov.product?.category || '')}</Badge>
                            </TableCell>
                            <TableCell>{getMovementTypeBadge(mov.movement_type)}</TableCell>
                            <TableCell className="text-center font-medium text-green-600">+{mov.quantity}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                              {mov.reason || '-'}
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell font-medium">
                              {formatCurrency(mov.quantity * (mov.product?.cost_price || 0))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground pt-4 border-t">
                <span>{entradas.length} movimentações</span>
                <div className="flex gap-4">
                  <span className="text-green-600 font-medium">+{stats.totalEntradas} itens</span>
                  <span className="font-medium text-foreground">{formatCurrency(stats.valorEntradas)}</span>
                </div>
              </div>
            </TabsContent>

            {/* Saidas Tab */}
            <TabsContent value="saidas" className="mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="hidden md:table-cell">Motivo</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saidas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhuma saída no período
                          </TableCell>
                        </TableRow>
                      ) : (
                        saidas.map((mov) => (
                          <TableRow key={mov.id}>
                            <TableCell className="text-xs">
                              <div>{format(parseISO(mov.created_at), 'dd/MM/yyyy')}</div>
                              <div className="text-muted-foreground">{format(parseISO(mov.created_at), 'HH:mm')}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{mov.product?.name || '-'}</div>
                              <div className="text-xs text-muted-foreground font-mono">{mov.product?.code}</div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{getCategoryLabel(mov.product?.category || '')}</Badge>
                            </TableCell>
                            <TableCell>{getMovementTypeBadge(mov.movement_type)}</TableCell>
                            <TableCell className="text-center font-medium text-red-600">-{mov.quantity}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                              {mov.reason || '-'}
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell font-medium">
                              {formatCurrency(mov.quantity * (mov.product?.cost_price || 0))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground pt-4 border-t">
                <span>{saidas.length} movimentações</span>
                <div className="flex gap-4">
                  <span className="text-red-600 font-medium">-{stats.totalSaidas} itens</span>
                  <span className="font-medium text-foreground">{formatCurrency(stats.valorSaidas)}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
