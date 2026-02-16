import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Truck, Users, ClipboardList, TrendingUp, 
  AlertTriangle, CheckCircle, HardHat, Building2
} from 'lucide-react';
import { useDashboardStats, useRecentActivities, useStockAlerts, useOSTrend, useStockByCategory, useEmployeesStats, useObrasStats, useStockValue } from '@/hooks/useDashboardStats';
import { useConsolidatedStats } from '@/hooks/useConsolidatedStats';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { useMatrizBranch } from '@/contexts/MatrizBranchContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { DashboardCalendar } from './DashboardCalendar';
import { StatCardsGrid } from './StatCardsGrid';
import { BranchStatsTable } from './BranchStatsTable';
import { MatrizBranchSelector } from './MatrizBranchSelector';


// Helper function for activity icons
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'stock': return Package;
    case 'vehicle': return Truck;
    case 'employee': return Users;
    case 'service_order': return ClipboardList;
    case 'obra': return HardHat;
    default: return TrendingUp;
  }
};

export function DashboardOverview() {
  const navigate = useNavigate();
  const { isMatriz, isDirector } = useBranchFilter();
  const { selectedBranchId, setSelectedBranchId } = useMatrizBranch();
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities();
  const { data: alerts } = useStockAlerts();
  const { data: osTrend } = useOSTrend();
  const { data: stockByCategory } = useStockByCategory();
  const { data: employeesStats } = useEmployeesStats();
  const { data: obrasStats } = useObrasStats();
  const { data: stockValue } = useStockValue();
  const { data: consolidatedStats } = useConsolidatedStats();

  // Show consolidated view for Matriz users when viewing all branches
  const showConsolidated = (isMatriz || isDirector) && !selectedBranchId;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const statCards = [
    { 
      label: 'Itens no Catálogo', 
      value: statsLoading ? null : stats?.totalProducts?.toLocaleString() || '0', 
      icon: Package,
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-500',
      href: '/estoque',
      subValue: alerts?.length ? `${alerts.length} alertas` : null,
      subColor: 'text-destructive',
    },
    { 
      label: 'Colaboradores', 
      value: employeesStats?.active?.toString() || '0', 
      icon: Users,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-500',
      href: '/rh',
      subValue: employeesStats?.onLeave ? `${employeesStats.onLeave} afastados` : null,
      subColor: 'text-amber-500',
    },
    { 
      label: 'Veículos', 
      value: statsLoading ? null : stats?.vehiclesCount?.toString() || '0', 
      icon: Truck,
      gradient: 'from-cyan-500/20 to-cyan-500/5',
      iconColor: 'text-cyan-500',
      href: '/frota',
      subValue: null,
      subColor: '',
    },
    { 
      label: 'Ordens de Serviço', 
      value: statsLoading ? null : stats?.osThisMonth?.toString() || '0', 
      icon: ClipboardList,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-500',
      href: '/os',
      subValue: 'este mês',
      subColor: 'text-muted-foreground',
    },
    { 
      label: 'Obras Ativas', 
      value: obrasStats?.active?.toString() || '0', 
      icon: HardHat,
      gradient: 'from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-500',
      href: '/obras',
      subValue: obrasStats?.completed ? `${obrasStats.completed} concluídas` : null,
      subColor: 'text-emerald-500',
    },
    { 
      label: 'Equipes', 
      value: employeesStats?.technicians?.toString() || '0', 
      icon: Users,
      gradient: 'from-orange-500/20 to-orange-500/5',
      iconColor: 'text-orange-500',
      href: '/equipes',
      subValue: 'técnicos ativos',
      subColor: 'text-muted-foreground',
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      {isMatriz && (
        <div className="lg:hidden">
          <MatrizBranchSelector 
            selectedBranchId={selectedBranchId} 
            onSelectBranch={setSelectedBranchId} 
          />
        </div>
      )}

      <StatCardsGrid cards={statCards} />

      {showConsolidated && consolidatedStats && (
        <BranchStatsTable 
          branches={consolidatedStats.branches} 
          totals={consolidatedStats.totals} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5">
        <div className="lg:col-span-8">
          <DashboardCalendar sector="overview" />
        </div>

        <Card className="lg:col-span-4 futuristic-card rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Estoque por Categoria</CardTitle>
            <CardDescription className="text-xs">Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockByCategory || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {(stockByCategory || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string, entry: any) => [
                      `${value} itens`,
                      entry.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {(stockByCategory || []).slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                  <span className="text-xs font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="futuristic-card rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Tendência de Ordens de Serviço</CardTitle>
              <CardDescription className="text-xs">Últimos 6 meses</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Concluídas</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[200px] chart-container p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={osTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="os" 
                  name="Total"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorOs)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="concluidas" 
                  name="Concluídas"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorConcluidas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        <Card className="futuristic-card rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Atividades Recentes</CardTitle>
            <CardDescription className="text-xs">Últimas movimentações</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-2">
                {activities.slice(0, 4).map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-tight">{activity.action}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{activity.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Nenhuma atividade</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="futuristic-card rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas
            </CardTitle>
            <CardDescription className="text-xs">Requerem atenção</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {alerts && alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`p-2.5 rounded-lg text-xs ${
                    alert.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                    alert.type === 'warning' ? 'bg-warning/10 text-warning-foreground border border-warning/20' :
                    'bg-info/10 text-info-foreground border border-info/20'
                  }`}>
                    {alert.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/10 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Tudo em ordem!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}