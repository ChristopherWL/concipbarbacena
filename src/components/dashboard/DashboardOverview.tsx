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
    <div className="space-y-6">

      {/* Matriz Branch Selector - Mobile only */}
      {isMatriz && (
        <div className="lg:hidden">
          <MatrizBranchSelector 
            selectedBranchId={selectedBranchId} 
            onSelectBranch={setSelectedBranchId} 
          />
        </div>
      )}


      {/* Stats Grid */}
      <StatCardsGrid cards={statCards} />

      {/* Branch Breakdown Table - Only when viewing all branches */}
      {showConsolidated && consolidatedStats && (
        <BranchStatsTable 
          branches={consolidatedStats.branches} 
          totals={consolidatedStats.totals} 
        />
      )}

      {/* Calendar + Pie Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar/Agenda */}
        <div className="lg:col-span-2">
          <DashboardCalendar sector="overview" />
        </div>

        {/* Pie Chart */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estoque por Categoria</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockByCategory || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(stockByCategory || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string, entry: any) => [
                      `${value} itens`,
                      entry.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(stockByCategory || []).slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OS Trend Chart */}
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Tendência de OS</CardTitle>
              <CardDescription>Ordens de serviço nos últimos 6 meses</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={osTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="os" 
                  name="Total"
                  stroke="#3b82f6" 
                  strokeWidth={2.5}
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
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-muted-foreground">Total OS</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Concluídas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Atividades Recentes</CardTitle>
                <CardDescription>Últimas movimentações do sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas
            </CardTitle>
            <CardDescription>Itens que requerem atenção</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {alerts && alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg text-sm ${
                    alert.type === 'error' ? 'bg-destructive/10 text-destructive' :
                    alert.type === 'warning' ? 'bg-warning/10 text-warning-foreground' :
                    'bg-info/10 text-info-foreground'
                  }`}>
                    {alert.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-3">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">Tudo em ordem!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
