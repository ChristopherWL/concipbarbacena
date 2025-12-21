import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useProducts } from '@/hooks/useProducts';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { useMatrizBranch } from '@/contexts/MatrizBranchContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, ArrowLeftRight, HardHat, Wrench, FileSpreadsheet, 
  Search, Download, Loader2, Users, ShieldCheck, Box, Boxes,
  Building2, ClipboardList, LayoutGrid, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportFichaEPI } from '@/lib/exportFichaEPI';
import { exportFichaFerramentas } from '@/lib/exportFichaFerramentas';
import { RelatorioObras } from '@/components/relatorios/RelatorioObras';
import { RelatorioDiarioObras } from '@/components/relatorios/RelatorioDiarioObras';
import { RelatorioInventario } from '@/components/relatorios/RelatorioInventario';
import { RelatorioGarantia } from '@/components/relatorios/RelatorioGarantia';

export default function Relatorios() {
  const [activeTab, setActiveTab] = useState('obras');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const { tenant, profile, selectedBranch } = useAuth();
  const { selectedBranchId } = useMatrizBranch();
  
  // Check if user is from matriz and no branch is selected
  const isMatriz = selectedBranch?.is_main === true;
  const showBranchWarning = isMatriz && !selectedBranchId;
  const { data: movements = [], isLoading: loadingMovements } = useStockMovements();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { employees, isLoading: loadingEmployees } = useEmployees();

  // Fetch all EPI assignments
  const { data: allEPIAssignments = [], isLoading: loadingEPI } = useQuery({
    queryKey: ['all-epi-assignments', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('employee_epi_assignments')
        .select(`
          *,
          employee:employees(id, name, position, hire_date, termination_date)
        `)
        .eq('tenant_id', tenant.id)
        .order('delivery_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Fetch all Ferramentas assignments
  const { data: allFerramentasAssignments = [], isLoading: loadingFerramentas } = useQuery({
    queryKey: ['all-ferramentas-assignments', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('employee_ferramentas_assignments')
        .select(`
          *,
          employee:employees(id, name, position, department, hire_date, termination_date)
        `)
        .eq('tenant_id', tenant.id)
        .order('delivery_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Fetch all EPC assignments
  const { data: allEPCAssignments = [], isLoading: loadingEPC } = useQuery({
    queryKey: ['all-epc-assignments', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('employee_epc_assignments')
        .select(`
          *,
          employee:employees(id, name, position, department, hire_date, termination_date)
        `)
        .eq('tenant_id', tenant.id)
        .order('delivery_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const COLORS = ['hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];

  // Filter movements
  const filteredMovements = useMemo(() => {
    return movements.filter(mov => {
      const matchesSearch = !searchTerm || 
        mov.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = movementTypeFilter === 'all' || mov.movement_type === movementTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [movements, searchTerm, movementTypeFilter]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const categories = ['epi', 'epc', 'ferramentas', 'materiais', 'equipamentos'];
    const grouped: Record<string, typeof products> = {};
    
    categories.forEach(cat => {
      grouped[cat] = products.filter(p => p.category === cat);
    });
    
    return grouped;
  }, [products]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, categoryFilter, searchTerm]);

  // Filter EPI assignments
  const filteredEPIAssignments = useMemo(() => {
    return allEPIAssignments.filter(a => {
      const matchesSearch = !searchTerm || 
        a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmployee = employeeFilter === 'all' || a.employee_id === employeeFilter;
      return matchesSearch && matchesEmployee;
    });
  }, [allEPIAssignments, searchTerm, employeeFilter]);

  // Filter Ferramentas assignments
  const filteredFerramentasAssignments = useMemo(() => {
    return allFerramentasAssignments.filter(a => {
      const matchesSearch = !searchTerm || 
        a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmployee = employeeFilter === 'all' || a.employee_id === employeeFilter;
      return matchesSearch && matchesEmployee;
    });
  }, [allFerramentasAssignments, searchTerm, employeeFilter]);

  // Filter EPC assignments
  const filteredEPCAssignments = useMemo(() => {
    return allEPCAssignments.filter(a => {
      const matchesSearch = !searchTerm || 
        a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmployee = employeeFilter === 'all' || a.employee_id === employeeFilter;
      return matchesSearch && matchesEmployee;
    });
  }, [allEPCAssignments, searchTerm, employeeFilter]);

  // Stock chart data
  const stockChartData = useMemo(() => {
    return [
      { name: 'EPI', value: productsByCategory.epi?.length || 0 },
      { name: 'EPC', value: productsByCategory.epc?.length || 0 },
      { name: 'Ferramentas', value: productsByCategory.ferramentas?.length || 0 },
      { name: 'Materiais', value: productsByCategory.materiais?.length || 0 },
      { name: 'Equipamentos', value: productsByCategory.equipamentos?.length || 0 },
    ].filter(item => item.value > 0);
  }, [productsByCategory]);

  // Movement type labels
  const getMovementTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      entrada: { label: 'Entrada', variant: 'default' },
      saida: { label: 'Saída', variant: 'destructive' },
      transferencia: { label: 'Transferência', variant: 'secondary' },
      ajuste: { label: 'Ajuste', variant: 'outline' },
      devolucao: { label: 'Devolução', variant: 'secondary' },
    };
    const config = variants[type] || { label: type, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Export EPI ficha for employee
  const handleExportEPI = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || !tenant) return;

    const epiAssignments = allEPIAssignments
      .filter(a => a.employee_id === employeeId)
      .map(a => ({
        quantity: a.quantity,
        description: a.description,
        size: a.size,
        ca_number: a.ca_number,
        delivery_date: a.delivery_date,
        return_date: a.return_date,
        return_reason: a.return_reason,
      }));

    exportFichaEPI(
      { name: tenant.name, address: tenant.address, city: tenant.city, state: tenant.state },
      { 
        name: employee.name, 
        position: employee.position, 
        hire_date: employee.hire_date, 
        termination_date: employee.termination_date 
      },
      epiAssignments,
      { blusa: employee.blusa_numero, calca: employee.calca_numero, calcado: employee.calcado_numero }
    );
  };

  // Export Ferramentas ficha for employee
  const handleExportFerramentas = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || !tenant) return;

    const ferramentasAssignments = allFerramentasAssignments
      .filter(a => a.employee_id === employeeId)
      .map(a => ({
        quantity: a.quantity,
        description: a.description,
        serial_number: a.serial_number,
        delivery_date: a.delivery_date,
        return_date: a.return_date,
        return_reason: a.return_reason,
        condition_delivery: a.condition_delivery,
        condition_return: a.condition_return,
      }));

    exportFichaFerramentas(
      { name: tenant.name, address: tenant.address, city: tenant.city, state: tenant.state },
      { 
        name: employee.name, 
        position: employee.position,
        department: employee.department,
        hire_date: employee.hire_date, 
        termination_date: employee.termination_date 
      },
      ferramentasAssignments
    );
  };

  // Get unique employees with assignments
  const employeesWithEPI = useMemo(() => {
    const employeeIds = [...new Set(allEPIAssignments.map(a => a.employee_id))];
    return employees.filter(e => employeeIds.includes(e.id));
  }, [employees, allEPIAssignments]);

  const employeesWithFerramentas = useMemo(() => {
    const employeeIds = [...new Set(allFerramentasAssignments.map(a => a.employee_id))];
    return employees.filter(e => employeeIds.includes(e.id));
  }, [employees, allFerramentasAssignments]);

  return (
    <DashboardLayout>
      <div className="space-y-6" data-tour="reports-content">
        <div className="flex flex-col items-center text-center gap-2 sm:-mt-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Movimentações, estoque e fichas de colaboradores
          </p>
        </div>

        {showBranchWarning && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Building2 className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Você está visualizando dados de todas as filiais.</span>{' '}
              Para ver dados de uma filial específica, selecione-a no menu superior.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Mobile: Dropdown selector */}
          <div className="sm:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="obras">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Obras
                  </span>
                </SelectItem>
                <SelectItem value="diario">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Diário de Obras
                  </span>
                </SelectItem>
                <SelectItem value="inventario">
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Inventário
                  </span>
                </SelectItem>
                <SelectItem value="garantia">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Garantia
                  </span>
                </SelectItem>
                <SelectItem value="epi">
                  <span className="flex items-center gap-2">
                    <HardHat className="h-4 w-4" />
                    EPI
                  </span>
                </SelectItem>
                <SelectItem value="epc">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    EPC
                  </span>
                </SelectItem>
                <SelectItem value="ferramentas">
                  <span className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Ferramentas
                  </span>
                </SelectItem>
                <SelectItem value="movimentacoes">
                  <span className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" />
                    Movimentações
                  </span>
                </SelectItem>
                <SelectItem value="estoque">
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Estoque
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Tabs responsivas com quebra de linha */}
          <div className="hidden sm:block">
            <TabsList className="!inline-flex !flex-wrap !h-auto gap-1 p-1.5 bg-muted/50 backdrop-blur-sm border border-border/50 rounded-lg !overflow-visible w-full justify-center">
              <TabsTrigger value="obras" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Building2 className="h-4 w-4" />
                Obras
              </TabsTrigger>
              <TabsTrigger value="diario" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ClipboardList className="h-4 w-4" />
                Diário
              </TabsTrigger>
              <TabsTrigger value="inventario" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <LayoutGrid className="h-4 w-4" />
                Inventário
              </TabsTrigger>
              <TabsTrigger value="garantia" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Shield className="h-4 w-4" />
                Garantia
              </TabsTrigger>
              <TabsTrigger value="epi" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <HardHat className="h-4 w-4" />
                EPI
              </TabsTrigger>
              <TabsTrigger value="epc" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                EPC
              </TabsTrigger>
              <TabsTrigger value="ferramentas" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Wrench className="h-4 w-4" />
                Ferramentas
              </TabsTrigger>
              <TabsTrigger value="movimentacoes" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ArrowLeftRight className="h-4 w-4" />
                Movimentações
              </TabsTrigger>
              <TabsTrigger value="estoque" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Package className="h-4 w-4" />
                Estoque
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Obras Tab */}
          <TabsContent value="obras">
            <RelatorioObras />
          </TabsContent>

          {/* Diário de Obras Tab */}
          <TabsContent value="diario">
            <RelatorioDiarioObras />
          </TabsContent>

          {/* Inventário Tab */}
          <TabsContent value="inventario">
            <RelatorioInventario />
          </TabsContent>

          {/* Garantia Tab */}
          <TabsContent value="garantia">
            <RelatorioGarantia />
          </TabsContent>

          {/* Movimentações Tab */}
          <TabsContent value="movimentacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Movimentações</CardTitle>
                <CardDescription>Todas as entradas e saídas de estoque</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por produto ou motivo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="devolucao">Devolução</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loadingMovements ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="hidden sm:table-cell">Estoque Anterior</TableHead>
                          <TableHead className="hidden sm:table-cell">Estoque Atual</TableHead>
                          <TableHead className="hidden md:table-cell">Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Nenhuma movimentação encontrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMovements.map((mov) => (
                            <TableRow key={mov.id}>
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(mov.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                              </TableCell>
                              <TableCell className="font-medium">{mov.product?.name || '-'}</TableCell>
                              <TableCell>{getMovementTypeBadge(mov.movement_type)}</TableCell>
                              <TableCell className="text-right font-medium">{mov.quantity}</TableCell>
                              <TableCell className="hidden sm:table-cell text-muted-foreground">
                                {mov.previous_stock}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{mov.new_stock}</TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                                {mov.reason || '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estoque Tab */}
          <TabsContent value="estoque" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Relatório de Estoque
                    </CardTitle>
                    <CardDescription>Visão geral de todos os produtos por categoria</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'EPI', count: productsByCategory.epi?.length || 0, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
                    { label: 'EPC', count: productsByCategory.epc?.length || 0, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
                    { label: 'Ferramentas', count: productsByCategory.ferramentas?.length || 0, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
                    { label: 'Materiais', count: productsByCategory.materiais?.length || 0, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
                    { label: 'Equipamentos', count: productsByCategory.equipamentos?.length || 0, color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
                  ].map((cat) => (
                    <div key={cat.label} className={`p-3 rounded-lg border ${cat.color}`}>
                      <p className="text-2xl font-bold">{cat.count}</p>
                      <p className="text-xs font-medium">{cat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Chart and Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-4">Distribuição por Categoria</h4>
                      {loadingProducts ? (
                        <div className="flex items-center justify-center h-48">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : stockChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={stockChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={70}
                              dataKey="value"
                            >
                              {stockChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                          Sem dados disponíveis
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="epi">EPI</SelectItem>
                            <SelectItem value="epc">EPC</SelectItem>
                            <SelectItem value="ferramentas">Ferramentas</SelectItem>
                            <SelectItem value="materiais">Materiais</SelectItem>
                            <SelectItem value="equipamentos">Equipamentos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {loadingProducts ? (
                        <div className="space-y-2">
                          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                      ) : (
                        <ScrollArea className="h-[350px] rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>Código</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead className="text-right">Estoque</TableHead>
                                <TableHead className="text-right">Mínimo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredProducts.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    Nenhum produto encontrado
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredProducts.map((product) => (
                                  <TableRow key={product.id} className="hover:bg-muted/30">
                                    <TableCell className="font-mono text-xs text-muted-foreground">{product.code || '-'}</TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="capitalize text-xs">
                                        {product.category}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${
                                      (product.current_stock || 0) <= (product.min_stock || 0) ? 'text-destructive' : 'text-foreground'
                                    }`}>
                                      {product.current_stock || 0}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                      {product.min_stock || 0}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                        <span>Total: {filteredProducts.length} produtos</span>
                        <span>Estoque total: {filteredProducts.reduce((acc, p) => acc + (p.current_stock || 0), 0)} unidades</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EPI Tab */}
          <TabsContent value="epi" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Colaboradores com EPI
                  </CardTitle>
                  <CardDescription>Exporte fichas individuais</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {employeesWithEPI.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum colaborador com EPI atribuído
                        </p>
                      ) : (
                        employeesWithEPI.map((employee) => (
                          <div key={employee.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                            <div>
                              <p className="font-medium text-sm">{employee.name}</p>
                              <p className="text-xs text-muted-foreground">{employee.position || 'Sem cargo'}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleExportEPI(employee.id)}
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Fichas de EPI</CardTitle>
                  <CardDescription>Registro de EPIs entregues aos colaboradores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Colaborador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingEPI ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>EPI</TableHead>
                            <TableHead className="hidden sm:table-cell">CA</TableHead>
                            <TableHead className="text-center">Qtd</TableHead>
                            <TableHead>Entrega</TableHead>
                            <TableHead className="hidden sm:table-cell">Devolução</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEPIAssignments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                Nenhum registro de EPI
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredEPIAssignments.map((assignment) => (
                              <TableRow key={assignment.id}>
                                <TableCell className="font-medium">{assignment.employee?.name}</TableCell>
                                <TableCell>{assignment.description}</TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground">
                                  {assignment.ca_number || '-'}
                                </TableCell>
                                <TableCell className="text-center">{assignment.quantity}</TableCell>
                                <TableCell>
                                  {format(new Date(assignment.delivery_date), 'dd/MM/yy', { locale: ptBR })}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {assignment.return_date 
                                    ? format(new Date(assignment.return_date), 'dd/MM/yy', { locale: ptBR })
                                    : '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ferramentas Tab */}
          <TabsContent value="ferramentas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Colaboradores com Ferramentas
                  </CardTitle>
                  <CardDescription>Exporte fichas individuais</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {employeesWithFerramentas.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum colaborador com ferramentas atribuídas
                        </p>
                      ) : (
                        employeesWithFerramentas.map((employee) => (
                          <div key={employee.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                            <div>
                              <p className="font-medium text-sm">{employee.name}</p>
                              <p className="text-xs text-muted-foreground">{employee.position || 'Sem cargo'}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleExportFerramentas(employee.id)}
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Fichas de Ferramentas</CardTitle>
                  <CardDescription>Registro de ferramentas entregues aos colaboradores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Colaborador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingFerramentas ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Ferramenta</TableHead>
                            <TableHead className="hidden sm:table-cell">Nº Série</TableHead>
                            <TableHead className="text-center">Qtd</TableHead>
                            <TableHead>Entrega</TableHead>
                            <TableHead className="hidden sm:table-cell">Devolução</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFerramentasAssignments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                Nenhum registro de ferramentas
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredFerramentasAssignments.map((assignment) => (
                              <TableRow key={assignment.id}>
                                <TableCell className="font-medium">{assignment.employee?.name}</TableCell>
                                <TableCell>{assignment.description}</TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground">
                                  {assignment.serial_number || '-'}
                                </TableCell>
                                <TableCell className="text-center">{assignment.quantity}</TableCell>
                                <TableCell>
                                  {format(new Date(assignment.delivery_date), 'dd/MM/yy', { locale: ptBR })}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {assignment.return_date 
                                    ? format(new Date(assignment.return_date), 'dd/MM/yy', { locale: ptBR })
                                    : '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EPC Tab */}
          <TabsContent value="epc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fichas de EPC</CardTitle>
                <CardDescription>Registro de EPCs (Equipamento de Proteção Coletiva) entregues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingEPC ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Colaborador</TableHead>
                          <TableHead>EPC</TableHead>
                          <TableHead className="hidden sm:table-cell">Nº Série</TableHead>
                          <TableHead className="hidden sm:table-cell">Local</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead>Entrega</TableHead>
                          <TableHead className="hidden md:table-cell">Devolução</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEPCAssignments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Nenhum registro de EPC
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredEPCAssignments.map((assignment) => (
                            <TableRow key={assignment.id}>
                              <TableCell className="font-medium">{assignment.employee?.name}</TableCell>
                              <TableCell>{assignment.description}</TableCell>
                              <TableCell className="hidden sm:table-cell text-muted-foreground">
                                {assignment.serial_number || '-'}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-muted-foreground">
                                {assignment.location || '-'}
                              </TableCell>
                              <TableCell className="text-center">{assignment.quantity}</TableCell>
                              <TableCell>
                                {format(new Date(assignment.delivery_date), 'dd/MM/yy', { locale: ptBR })}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {assignment.return_date 
                                  ? format(new Date(assignment.return_date), 'dd/MM/yy', { locale: ptBR })
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
