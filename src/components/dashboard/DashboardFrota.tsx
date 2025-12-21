import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, Wrench, Fuel, AlertTriangle, Calendar,
  ArrowUpRight, CheckCircle, Clock, Plus
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useVehicles, useMaintenances } from '@/hooks/useFleet';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardCalendar } from './DashboardCalendar';
import { StatCardsGrid } from './StatCardsGrid';

const fuelData = [
  { name: 'Jan', custo: 3200 },
  { name: 'Fev', custo: 2800 },
  { name: 'Mar', custo: 3500 },
  { name: 'Abr', custo: 3100 },
  { name: 'Mai', custo: 2900 },
  { name: 'Jun', custo: 3400 },
];

export function DashboardFrota() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: vehicles } = useVehicles();
  const { data: maintenances } = useMaintenances();

  const pendingMaintenances = maintenances?.filter(m => m.status === 'agendada') || [];
  const inProgressMaintenances = maintenances?.filter(m => m.status === 'em_andamento') || [];

  const statCards = [
    { 
      label: 'Veículos Ativos', 
      value: isLoading ? null : stats?.vehiclesCount?.toString() || '0', 
      change: 'Todos operacionais', 
      changeType: 'positive' as const,
      icon: Truck,
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-500',
    },
    { 
      label: 'Manutenções Pendentes', 
      value: pendingMaintenances.length.toString(), 
      change: pendingMaintenances.length > 0 ? 'Agendar!' : 'Tudo em dia', 
      changeType: pendingMaintenances.length > 0 ? 'negative' as const : 'positive' as const,
      icon: Wrench,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-500',
    },
    { 
      label: 'Em Manutenção', 
      value: inProgressMaintenances.length.toString(), 
      change: 'Em andamento', 
      changeType: 'neutral' as const,
      icon: Clock,
      gradient: 'from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-500',
    },
    { 
      label: 'Custo Combustível', 
      value: 'R$ 3.400', 
      change: '+8% vs mês anterior', 
      changeType: 'negative' as const,
      icon: Fuel,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <StatCardsGrid cards={statCards} isLoading={isLoading} />

      {/* Calendar + Maintenance Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCalendar sector="frota" />
        </div>
        {/* Upcoming Maintenances Panel */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Manutenções
            </CardTitle>
            <CardDescription>Próximas agendadas</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingMaintenances.length > 0 ? (
              <div className="space-y-2">
                {pendingMaintenances.slice(0, 5).map((maintenance) => (
                  <div key={maintenance.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{maintenance.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {maintenance.scheduled_date ? format(new Date(maintenance.scheduled_date), "dd 'de' MMM", { locale: ptBR }) : 'Sem data'}
                      </p>
                    </div>
                    <Badge variant={maintenance.maintenance_type === 'preventiva' ? 'default' : 'destructive'} className="ml-2 text-[10px]">
                      {maintenance.maintenance_type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[150px] flex flex-col items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fuel Cost Trend */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Custo de Combustível</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </div>
              <Fuel className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fuelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Custo']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="custo" 
                    stroke="#06b6d4" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorFuel)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Maintenances */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas Manutenções
            </CardTitle>
            <CardDescription>Agendadas</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingMaintenances.length > 0 ? (
              <div className="space-y-3">
                {pendingMaintenances.slice(0, 4).map((maintenance) => (
                  <div key={maintenance.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{maintenance.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {maintenance.scheduled_date ? format(new Date(maintenance.scheduled_date), "dd 'de' MMM", { locale: ptBR }) : 'Sem data'}
                      </p>
                    </div>
                    <Badge variant={maintenance.maintenance_type === 'preventiva' ? 'default' : 'destructive'}>
                      {maintenance.maintenance_type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma manutenção pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicles List */}
      {vehicles && vehicles.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Veículos da Frota</CardTitle>
            <CardDescription>Status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {vehicles.slice(0, 8).map((vehicle) => (
                <div key={vehicle.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Truck className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{vehicle.plate}</p>
                    <p className="text-xs text-muted-foreground truncate">{vehicle.brand} {vehicle.model}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {vehicle.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </div>
        </CardContent>
        </Card>
      )}
    </div>
  );
}
