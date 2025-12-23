import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useProducts } from '@/hooks/useProducts';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { useMatrizBranch } from '@/contexts/MatrizBranchContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, ArrowLeftRight, HardHat, Wrench, FileSpreadsheet, 
  Search, Loader2, Users, ShieldCheck, Building2, ClipboardList, 
  LayoutGrid, Shield, ChevronRight, BarChart3, TrendingUp,
  FileText, Calendar, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportFichaEPI } from '@/lib/exportFichaEPI';
import { exportFichaFerramentas } from '@/lib/exportFichaFerramentas';
import { 
  exportRelatorioMovimentacoes, 
  exportRelatorioEstoque, 
  exportRelatorioEPI, 
  exportRelatorioFerramentas,
  exportRelatorioEPC,
  exportRelatorioMovimentacaoIndividual,
  exportRelatorioProdutoIndividual,
  exportRelatorioEPIIndividual,
  exportRelatorioFerramentaIndividual,
  exportRelatorioEPCIndividual
} from '@/lib/exportRelatorioPDF';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

// Lazy load report components for better performance
const RelatorioObras = lazy(() => import('@/components/relatorios/RelatorioObras').then(m => ({ default: m.RelatorioObras })));
const RelatorioDiarioObras = lazy(() => import('@/components/relatorios/RelatorioDiarioObras').then(m => ({ default: m.RelatorioDiarioObras })));
const RelatorioInventario = lazy(() => import('@/components/relatorios/RelatorioInventario').then(m => ({ default: m.RelatorioInventario })));
const RelatorioGarantia = lazy(() => import('@/components/relatorios/RelatorioGarantia').then(m => ({ default: m.RelatorioGarantia })));

// Report card component for the grid view
interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  stats?: { label: string; value: string | number }[];
  onClick: () => void;
  isActive?: boolean;
}

function ReportCard({ title, description, icon: Icon, color, stats, onClick, isActive }: ReportCardProps) {
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 overflow-hidden relative",
        isActive 
          ? "border-primary shadow-lg shadow-primary/20" 
          : "border-transparent hover:border-primary/30"
      )}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        color
      )} />
      
      {/* Glow effect */}
      {isActive && (
        <div className="absolute inset-0 bg-primary/5" />
      )}
      
      <CardContent className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all duration-300",
            isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted group-hover:bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5 sm:h-6 sm:w-6 transition-colors",
              isActive ? "" : "text-muted-foreground group-hover:text-primary"
            )} />
          </div>
          <ChevronRight className={cn(
            "h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-1",
            isActive && "text-primary"
          )} />
        </div>
        
        <h3 className="font-semibold text-sm sm:text-base mb-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mb-2 sm:mb-3">{description}</p>
        
        {stats && stats.length > 0 && (
          <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-3 border-t border-border/50">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-base sm:text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading skeleton for lazy components
function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function Relatorios() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const { tenant, profile, selectedBranch } = useAuth();
  const { selectedBranchId } = useMatrizBranch();
  const { permissions } = useUserPermissions();
  
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

  // Group products by category
  const productsByCategory = useMemo(() => {
    const categories = ['epi', 'epc', 'ferramentas', 'materiais', 'equipamentos'];
    const grouped: Record<string, typeof products> = {};
    categories.forEach(cat => {
      grouped[cat] = products.filter(p => p.category === cat);
    });
    return grouped;
  }, [products]);

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

  // Filter products
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

  // Get unique employees with assignments
  const employeesWithEPI = useMemo(() => {
    const employeeIds = [...new Set(allEPIAssignments.map(a => a.employee_id))];
    return employees.filter(e => employeeIds.includes(e.id));
  }, [employees, allEPIAssignments]);

  const employeesWithFerramentas = useMemo(() => {
    const employeeIds = [...new Set(allFerramentasAssignments.map(a => a.employee_id))];
    return employees.filter(e => employeeIds.includes(e.id));
  }, [employees, allFerramentasAssignments]);

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

  // Export functions
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
      { name: employee.name, position: employee.position, hire_date: employee.hire_date, termination_date: employee.termination_date },
      epiAssignments,
      { blusa: employee.blusa_numero, calca: employee.calca_numero, calcado: employee.calcado_numero }
    );
  };

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
      { name: employee.name, position: employee.position, department: employee.department, hire_date: employee.hire_date, termination_date: employee.termination_date },
      ferramentasAssignments
    );
  };

  // Define available reports based on permissions
  const reports = useMemo(() => {
    const allReports = [
      { 
        id: 'obras', 
        title: 'Obras', 
        description: 'Acompanhamento de progresso e status das obras',
        icon: Building2, 
        color: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
        permission: 'page_obras',
        stats: []
      },
      { 
        id: 'diario', 
        title: 'Diário de Obras', 
        description: 'Registros diários de atividades em obras',
        icon: ClipboardList, 
        color: 'bg-gradient-to-br from-indigo-500/10 to-indigo-600/5',
        permission: 'page_diario_obras',
        stats: []
      },
      { 
        id: 'inventario', 
        title: 'Inventário', 
        description: 'Contagem e controle de estoque físico',
        icon: LayoutGrid, 
        color: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5',
        permission: 'page_stock',
        stats: []
      },
      { 
        id: 'garantia', 
        title: 'Garantia', 
        description: 'Controle de produtos em garantia e devoluções',
        icon: Shield, 
        color: 'bg-gradient-to-br from-violet-500/10 to-violet-600/5',
        permission: 'page_stock',
        stats: []
      },
      { 
        id: 'epi', 
        title: 'EPI', 
        description: 'Equipamentos de Proteção Individual',
        icon: HardHat, 
        color: 'bg-gradient-to-br from-amber-500/10 to-amber-600/5',
        permission: 'page_stock',
        stats: [
          { label: 'Registros', value: allEPIAssignments.length },
          { label: 'Colaboradores', value: employeesWithEPI.length }
        ]
      },
      { 
        id: 'epc', 
        title: 'EPC', 
        description: 'Equipamentos de Proteção Coletiva',
        icon: ShieldCheck, 
        color: 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/5',
        permission: 'page_stock',
        stats: [
          { label: 'Registros', value: allEPCAssignments.length }
        ]
      },
      { 
        id: 'ferramentas', 
        title: 'Ferramentas', 
        description: 'Controle de ferramentas e equipamentos',
        icon: Wrench, 
        color: 'bg-gradient-to-br from-orange-500/10 to-orange-600/5',
        permission: 'page_stock',
        stats: [
          { label: 'Registros', value: allFerramentasAssignments.length },
          { label: 'Colaboradores', value: employeesWithFerramentas.length }
        ]
      },
      { 
        id: 'movimentacoes', 
        title: 'Movimentações', 
        description: 'Histórico de entradas e saídas de estoque',
        icon: ArrowLeftRight, 
        color: 'bg-gradient-to-br from-rose-500/10 to-rose-600/5',
        permission: 'page_movimentacao',
        stats: [
          { label: 'Total', value: movements.length }
        ]
      },
      { 
        id: 'estoque', 
        title: 'Estoque', 
        description: 'Visão geral do estoque por categoria',
        icon: Package, 
        color: 'bg-gradient-to-br from-teal-500/10 to-teal-600/5',
        permission: 'page_stock',
        stats: [
          { label: 'Produtos', value: products.length },
          { label: 'Categorias', value: 5 }
        ]
      },
    ];

    return allReports.filter(report => {
      const permKey = report.permission as keyof typeof permissions;
      return permissions[permKey] === true;
    });
  }, [permissions, allEPIAssignments, allEPCAssignments, allFerramentasAssignments, employeesWithEPI, employeesWithFerramentas, movements, products]);

  // Render active report content
  const renderReportContent = () => {
    if (!activeReport) return null;

    const commonProps = {
      searchTerm,
      setSearchTerm,
      employeeFilter,
      setEmployeeFilter,
      employees,
    };

    switch (activeReport) {
      case 'obras':
        return (
          <Suspense fallback={<ReportSkeleton />}>
            <RelatorioObras />
          </Suspense>
        );
      case 'diario':
        return (
          <Suspense fallback={<ReportSkeleton />}>
            <RelatorioDiarioObras />
          </Suspense>
        );
      case 'inventario':
        return (
          <Suspense fallback={<ReportSkeleton />}>
            <RelatorioInventario />
          </Suspense>
        );
      case 'garantia':
        return (
          <Suspense fallback={<ReportSkeleton />}>
            <RelatorioGarantia />
          </Suspense>
        );
      case 'movimentacoes':
        return <MovimentacoesReport {...commonProps} movements={filteredMovements} loading={loadingMovements} movementTypeFilter={movementTypeFilter} setMovementTypeFilter={setMovementTypeFilter} getMovementTypeBadge={getMovementTypeBadge} tenant={tenant} />;
      case 'estoque':
        return <EstoqueReport {...commonProps} products={filteredProducts} loading={loadingProducts} stockChartData={stockChartData} COLORS={COLORS} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} productsByCategory={productsByCategory} tenant={tenant} />;
      case 'epi':
        return <EPIReport {...commonProps} assignments={filteredEPIAssignments} loading={loadingEPI} employeesWithAssignments={employeesWithEPI} onExport={handleExportEPI} tenant={tenant} />;
      case 'epc':
        return <EPCReport {...commonProps} assignments={filteredEPCAssignments} loading={loadingEPC} tenant={tenant} />;
      case 'ferramentas':
        return <FerramentasReport {...commonProps} assignments={filteredFerramentasAssignments} loading={loadingFerramentas} employeesWithAssignments={employeesWithFerramentas} onExport={handleExportFerramentas} tenant={tenant} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen relative">
        {/* Futuristic Background - Hidden on mobile for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-info/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto space-y-4 sm:space-y-6 px-3 py-4 sm:p-6" data-tour="reports-content">
          <PageHeader 
            title="Central de Relatórios" 
            description="Acesse todos os relatórios do sistema em um só lugar"
          />

          {showBranchWarning && (
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Building2 className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Visualizando dados de todas as filiais.</span>{' '}
                Selecione uma filial específica no menu superior para filtrar.
              </AlertDescription>
            </Alert>
          )}

          {/* Report Selection or Content */}
          {!activeReport ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                {[
                  { icon: Package, label: 'Produtos', value: products.length, color: 'text-blue-500 bg-blue-500/10' },
                  { icon: ArrowLeftRight, label: 'Movimentações', value: movements.length, color: 'text-emerald-500 bg-emerald-500/10' },
                  { icon: Users, label: 'Colaboradores', value: employees.length, color: 'text-amber-500 bg-amber-500/10' },
                  { icon: FileText, label: 'Relatórios', value: reports.length, color: 'text-violet-500 bg-violet-500/10' },
                ].map((stat, i) => (
                  <Card key={i} className="border-0 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                      <div className={cn("p-2 sm:p-3 rounded-xl", stat.color)}>
                        <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Reports Grid */}
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Selecione um relatório
                </h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      title={report.title}
                      description={report.description}
                      icon={report.icon}
                      color={report.color}
                      stats={report.stats}
                      onClick={() => setActiveReport(report.id)}
                      isActive={activeReport === report.id}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Back button and title */}
              <div className="flex items-center gap-2 sm:gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setActiveReport(null);
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setMovementTypeFilter('all');
                    setEmployeeFilter('all');
                  }}
                  className="gap-1 sm:gap-2 px-2 sm:px-3"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  <span className="hidden xs:inline">Voltar</span>
                </Button>
                <div className="h-6 w-px bg-border hidden xs:block" />
                <h2 className="font-semibold text-sm sm:text-base truncate">
                  {reports.find(r => r.id === activeReport)?.title}
                </h2>
              </div>

              {/* Report Content */}
              {renderReportContent()}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Sub-components for each report type
interface MovimentacoesReportProps {
  movements: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  movementTypeFilter: string;
  setMovementTypeFilter: (v: string) => void;
  getMovementTypeBadge: (type: string) => JSX.Element;
  tenant: any;
}

function MovimentacoesReport({ movements, loading, searchTerm, setSearchTerm, movementTypeFilter, setMovementTypeFilter, getMovementTypeBadge, tenant }: MovimentacoesReportProps) {
  const handleExportPDF = () => {
    const company = {
      name: tenant?.name || 'Empresa',
      cnpj: tenant?.cnpj,
      address: tenant?.address,
      city: tenant?.city,
      state: tenant?.state,
    };
    exportRelatorioMovimentacoes(
      company, 
      movements, 
      (date: string) => format(new Date(date), 'dd/MM/yy HH:mm', { locale: ptBR })
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Histórico de Movimentações
            </CardTitle>
            <CardDescription>Todas as entradas e saídas de estoque</CardDescription>
          </div>
          <Button size="sm" onClick={handleExportPDF} disabled={movements.length === 0}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por produto ou motivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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

        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="hidden sm:table-cell">Anterior</TableHead>
                  <TableHead className="hidden sm:table-cell">Atual</TableHead>
                  <TableHead className="hidden md:table-cell">Motivo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma movimentação encontrada</TableCell></TableRow>
                ) : (
                  movements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(mov.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell className="font-medium">{mov.product?.name || '-'}</TableCell>
                      <TableCell>{getMovementTypeBadge(mov.movement_type)}</TableCell>
                      <TableCell className="text-right font-medium">{mov.quantity}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{mov.previous_stock}</TableCell>
                      <TableCell className="hidden sm:table-cell">{mov.new_stock}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">{mov.reason || '-'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => exportRelatorioMovimentacaoIndividual({ name: tenant?.name || 'Empresa', cnpj: tenant?.cnpj, address: tenant?.address, city: tenant?.city, state: tenant?.state }, mov)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
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
  );
}

interface EstoqueReportProps {
  products: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  stockChartData: any[];
  COLORS: string[];
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  productsByCategory: Record<string, any[]>;
  tenant: any;
}

function EstoqueReport({ products, loading, searchTerm, setSearchTerm, stockChartData, COLORS, categoryFilter, setCategoryFilter, productsByCategory, tenant }: EstoqueReportProps) {
  const handleExportPDF = () => {
    const company = {
      name: tenant?.name || 'Empresa',
      cnpj: tenant?.cnpj,
      address: tenant?.address,
      city: tenant?.city,
      state: tenant?.state,
    };
    exportRelatorioEstoque(company, products, formatCurrency);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Relatório de Estoque
            </CardTitle>
            <CardDescription>Visão geral de todos os produtos por categoria</CardDescription>
          </div>
          <Button size="sm" onClick={handleExportPDF} disabled={products.length === 0}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {[
            { label: 'EPI', count: productsByCategory.epi?.length || 0, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
            { label: 'EPC', count: productsByCategory.epc?.length || 0, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
            { label: 'Ferramentas', count: productsByCategory.ferramentas?.length || 0, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
            { label: 'Materiais', count: productsByCategory.materiais?.length || 0, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
            { label: 'Equipamentos', count: productsByCategory.equipamentos?.length || 0, color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
          ].map((cat) => (
            <div key={cat.label} className={`p-2 sm:p-3 rounded-lg border ${cat.color}`}>
              <p className="text-lg sm:text-2xl font-bold">{cat.count}</p>
              <p className="text-[10px] sm:text-xs font-medium truncate">{cat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-4">Distribuição por Categoria</h4>
              {loading ? (
                <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : stockChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stockChartData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={70} dataKey="value">
                      {stockChartData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem dados disponíveis</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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

            {loading ? (
              <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
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
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhum produto encontrado</TableCell></TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs text-muted-foreground">{product.code || '-'}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize text-xs">{product.category}</Badge></TableCell>
                          <TableCell className={`text-right font-semibold ${(product.current_stock || 0) <= (product.min_stock || 0) ? 'text-destructive' : ''}`}>{product.current_stock || 0}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{product.min_stock || 0}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => exportRelatorioProdutoIndividual({ name: tenant?.name || 'Empresa', cnpj: tenant?.cnpj, address: tenant?.address, city: tenant?.city, state: tenant?.state }, product, [], formatCurrency)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
              <span>Total: {products.length} produtos</span>
              <span>Estoque: {products.reduce((acc, p) => acc + (p.current_stock || 0), 0)} un</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EPIReportProps {
  assignments: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  employeeFilter: string;
  setEmployeeFilter: (v: string) => void;
  employees: any[];
  employeesWithAssignments: any[];
  onExport: (id: string) => void;
  tenant: any;
}

function EPIReport({ assignments, loading, searchTerm, setSearchTerm, employeeFilter, setEmployeeFilter, employees, employeesWithAssignments, onExport, tenant }: EPIReportProps) {
  const handleExportPDF = () => {
    const company = { name: tenant?.name || 'Empresa', cnpj: tenant?.cnpj, address: tenant?.address, city: tenant?.city, state: tenant?.state };
    exportRelatorioEPI(company, assignments, (date: string) => format(new Date(date), 'dd/MM/yy', { locale: ptBR }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      <Card className="lg:col-span-1">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2"><Users className="h-4 w-4 sm:h-5 sm:w-5" />Colaboradores com EPI</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Exporte fichas individuais</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <ScrollArea className="h-[250px] sm:h-[300px]">
            <div className="space-y-2">
              {employeesWithAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum colaborador com EPI atribuído</p>
              ) : (
                employeesWithAssignments.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{employee.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{employee.position || 'Sem cargo'}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onExport(employee.id)} className="shrink-0 ml-2"><FileSpreadsheet className="h-4 w-4" /></Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Fichas de EPI</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Registro de EPIs entregues aos colaboradores</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Colaborador" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <ScrollArea className="h-[250px] sm:h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Colaborador</TableHead>
                    <TableHead className="text-xs">EPI</TableHead>
                    <TableHead className="hidden md:table-cell text-xs">CA</TableHead>
                    <TableHead className="text-center text-xs">Qtd</TableHead>
                    <TableHead className="text-xs">Entrega</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs">Devolução</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro de EPI</TableCell></TableRow>
                  ) : (
                    assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-xs sm:text-sm max-w-[100px] truncate">{a.employee?.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm max-w-[120px] truncate">{a.description}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{a.ca_number || '-'}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">{a.quantity}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">{format(new Date(a.delivery_date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">{a.return_date ? format(new Date(a.return_date), 'dd/MM/yy', { locale: ptBR }) : '-'}</TableCell>
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
  );
}

interface EPCReportProps {
  assignments: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  employeeFilter: string;
  setEmployeeFilter: (v: string) => void;
  employees: any[];
  tenant: any;
}

function EPCReport({ assignments, loading, searchTerm, setSearchTerm, employeeFilter, setEmployeeFilter, employees, tenant }: EPCReportProps) {
  const handleExportPDF = () => {
    const company = { name: tenant?.name || 'Empresa', cnpj: tenant?.cnpj, address: tenant?.address, city: tenant?.city, state: tenant?.state };
    exportRelatorioEPC(company, assignments, (date: string) => format(new Date(date), 'dd/MM/yy', { locale: ptBR }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Fichas de EPC</CardTitle>
        <CardDescription>Registro de EPCs (Equipamento de Proteção Coletiva) entregues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Colaborador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {employees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader><TableRow><TableHead>Colaborador</TableHead><TableHead>EPC</TableHead><TableHead className="hidden sm:table-cell">Nº Série</TableHead><TableHead className="hidden sm:table-cell">Local</TableHead><TableHead className="text-center">Qtd</TableHead><TableHead>Entrega</TableHead><TableHead className="hidden md:table-cell">Devolução</TableHead></TableRow></TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum registro de EPC</TableCell></TableRow>
                ) : (
                  assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.employee?.name}</TableCell>
                      <TableCell>{a.description}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{a.serial_number || '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{a.location || '-'}</TableCell>
                      <TableCell className="text-center">{a.quantity}</TableCell>
                      <TableCell>{format(new Date(a.delivery_date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                      <TableCell className="hidden md:table-cell">{a.return_date ? format(new Date(a.return_date), 'dd/MM/yy', { locale: ptBR }) : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface FerramentasReportProps {
  assignments: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  employeeFilter: string;
  setEmployeeFilter: (v: string) => void;
  employees: any[];
  employeesWithAssignments: any[];
  onExport: (id: string) => void;
  tenant: any;
}

function FerramentasReport({ assignments, loading, searchTerm, setSearchTerm, employeeFilter, setEmployeeFilter, employees, employeesWithAssignments, onExport, tenant }: FerramentasReportProps) {
  const handleExportPDF = () => {
    const company = { name: tenant?.name || 'Empresa', cnpj: tenant?.cnpj, address: tenant?.address, city: tenant?.city, state: tenant?.state };
    exportRelatorioFerramentas(company, assignments, (date: string) => format(new Date(date), 'dd/MM/yy', { locale: ptBR }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      <Card className="lg:col-span-1">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2"><Users className="h-4 w-4 sm:h-5 sm:w-5" />Colaboradores com Ferramentas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Exporte fichas individuais</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <ScrollArea className="h-[250px] sm:h-[300px]">
            <div className="space-y-2">
              {employeesWithAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum colaborador com ferramentas</p>
              ) : (
                employeesWithAssignments.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{employee.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{employee.position || 'Sem cargo'}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onExport(employee.id)} className="shrink-0 ml-2"><FileSpreadsheet className="h-4 w-4" /></Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Fichas de Ferramentas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Registro de ferramentas entregues aos colaboradores</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Colaborador" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader><TableRow><TableHead>Colaborador</TableHead><TableHead>Ferramenta</TableHead><TableHead className="hidden sm:table-cell">Nº Série</TableHead><TableHead className="text-center">Qtd</TableHead><TableHead>Entrega</TableHead><TableHead className="hidden sm:table-cell">Devolução</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro de ferramentas</TableCell></TableRow>
                  ) : (
                    assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.employee?.name}</TableCell>
                        <TableCell>{a.description}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{a.serial_number || '-'}</TableCell>
                        <TableCell className="text-center">{a.quantity}</TableCell>
                        <TableCell>{format(new Date(a.delivery_date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                        <TableCell className="hidden sm:table-cell">{a.return_date ? format(new Date(a.return_date), 'dd/MM/yy', { locale: ptBR }) : '-'}</TableCell>
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
  );
}
