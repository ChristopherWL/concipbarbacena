import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ClipboardList, Clock, CheckCircle, AlertTriangle,
  ArrowUpRight, Users, Calendar,
  UserCircle, UsersRound, Building2, Eye, MapPin
} from 'lucide-react';
import { useDashboardStats, useOSTrend, useOSByStatusChart, usePendingOS } from '@/hooks/useDashboardStats';
import { useHierarchyFilter } from '@/hooks/useHierarchyFilter';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardCalendar } from './DashboardCalendar';
import { StatCardsGrid } from './StatCardsGrid';

const getHierarchyLabel = (level: string) => {
  switch (level) {
    case 'technician': return { label: 'Minhas OS', icon: UserCircle, color: 'bg-blue-500' };
    case 'supervisor': return { label: 'Equipes', icon: UsersRound, color: 'bg-purple-500' };
    case 'manager': return { label: 'Filial', icon: Building2, color: 'bg-amber-500' };
    case 'director': return { label: 'Todas Filiais', icon: Eye, color: 'bg-emerald-500' };
    default: return { label: 'Visão Geral', icon: Eye, color: 'bg-gray-500' };
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'aberta': return { label: 'Aberta', variant: 'default' as const, color: 'bg-blue-500' };
    case 'em_andamento': return { label: 'Em Andamento', variant: 'secondary' as const, color: 'bg-amber-500' };
    case 'aguardando': return { label: 'Aguardando', variant: 'outline' as const, color: 'bg-cyan-500' };
    case 'concluida': return { label: 'Concluída', variant: 'default' as const, color: 'bg-emerald-500' };
    default: return { label: status, variant: 'outline' as const, color: 'bg-gray-500' };
  }
};

export function DashboardServico() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: osTrend } = useOSTrend();
  const { data: osStatusData } = useOSByStatusChart();
  const { data: pendingOS } = usePendingOS();
  const { level, isTechnician, isSupervisor, isManager, isDirector } = useHierarchyFilter();

  const hierarchyInfo = getHierarchyLabel(level);
  const HierarchyIcon = hierarchyInfo.icon;

  const statCards = [
    { 
      label: 'OS Abertas', 
      value: isLoading ? null : stats?.openOS?.toString() || '0', 
      change: `Total: ${stats?.totalOS || 0}`, 
      changeType: 'neutral' as const,
      icon: ClipboardList,
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-500',
    },
    { 
      label: 'Em Andamento', 
      value: isLoading ? null : stats?.inProgressOS?.toString() || '0', 
      change: 'em execução', 
      changeType: 'neutral' as const,
      icon: Clock,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-500',
    },
    { 
      label: 'Concluídas', 
      value: isLoading ? null : stats?.completedOS?.toString() || '0', 
      change: stats?.osChange ? `${stats.osChange > 0 ? '+' : ''}${stats.osChange}% vs mês anterior` : 'este mês', 
      changeType: (stats?.osChange || 0) > 0 ? 'positive' as const : 'neutral' as const,
      icon: CheckCircle,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-500',
    },
    { 
      label: 'Técnicos', 
      value: isLoading ? null : stats?.techniciansCount?.toString() || '0', 
      change: 'disponíveis', 
      changeType: 'neutral' as const,
      icon: Users,
      gradient: 'from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hierarchy Indicator */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${hierarchyInfo.color} text-white border-0 gap-1.5`}>
          <HierarchyIcon className="h-3.5 w-3.5" />
          {hierarchyInfo.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {isTechnician && 'Visualizando suas ordens de serviço'}
          {isSupervisor && 'Visualizando OS das suas equipes'}
          {isManager && 'Visualizando OS da sua filial'}
          {isDirector && 'Visualizando todas as OS'}
        </span>
      </div>

      {/* Stats Grid */}
      <StatCardsGrid cards={statCards} isLoading={isLoading} />

      {/* Calendar + Status Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCalendar sector="servico" />
        </div>
        {/* Status Distribution Panel */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por Status</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={osStatusData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(osStatusData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(osStatusData || []).map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-muted-foreground truncate">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OS Trend */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Tendência de OS</CardTitle>
                <CardDescription>Ordens de serviço nos últimos 6 meses</CardDescription>
              </div>
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={osTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOs2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorConcluidas2" x1="0" y1="0" x2="0" y2="1">
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
                    name="Total OS"
                    stroke="#3b82f6" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorOs2)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="concluidas" 
                    name="Concluídas"
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorConcluidas2)" 
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

        {/* Status Distribution */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por Status</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={osStatusData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(osStatusData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(osStatusData || []).map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-muted-foreground truncate">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending OS List */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Próximas OS</CardTitle>
              <CardDescription>Ordens de serviço pendentes</CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {pendingOS && pendingOS.length > 0 ? (
            <div className="space-y-3">
              {pendingOS.map((os) => {
                const statusInfo = getStatusBadge(os.status);
                return (
                  <div 
                    key={os.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/ordens-servico')}
                  >
                    <div className={`w-1 h-full min-h-[48px] rounded-full ${statusInfo.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">OS #{os.orderNumber}</span>
                        <Badge variant={statusInfo.variant} className="text-[10px] h-5">
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{os.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        {os.customer && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {os.customer}
                          </span>
                        )}
                        {os.team && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {os.team}
                          </span>
                        )}
                      </div>
                    </div>
                    {os.scheduledDate && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-foreground">
                          {format(new Date(os.scheduledDate), 'dd/MM', { locale: ptBR })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(os.scheduledDate), 'HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-3">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhuma OS pendente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
