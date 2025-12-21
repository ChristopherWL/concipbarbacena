import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, AlertTriangle, TrendingDown, TrendingUp,
  ArrowUpRight, ArrowDownRight, Boxes, BarChart3, DollarSign, Tag
} from 'lucide-react';
import { useDashboardStats, useStockAlerts, useStockByCategory, useStockMovementsTrend, useStockValue, useTodayMovements } from '@/hooks/useDashboardStats';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { DashboardCalendar } from './DashboardCalendar';
import { StatCardsGrid } from './StatCardsGrid';

export function DashboardEstoque() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: alerts } = useStockAlerts();
  const { data: stockByCategory } = useStockByCategory();
  const { data: movementsTrend } = useStockMovementsTrend();
  const { data: stockValue } = useStockValue();
  const { data: todayMovements } = useTodayMovements();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalCategoryValue = stockByCategory?.reduce((acc, c) => acc + (c.total || 0), 0) || 0;

  const statCards = [
    { 
      label: 'Total em Estoque', 
      value: isLoading ? null : stats?.totalStock?.toLocaleString() || '0', 
      subValue: stockValue ? formatCurrency(stockValue) : null,
      change: `${stats?.totalProducts || 0} produtos ativos`, 
      changeType: 'neutral' as const,
      icon: Package,
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-500',
    },
    { 
      label: 'Itens Baixo Estoque', 
      value: isLoading ? null : stats?.lowStockProducts?.length?.toString() || '0', 
      subValue: null,
      change: stats?.lowStockProducts?.length ? 'Atenção necessária' : 'Estoque ok', 
      changeType: stats?.lowStockProducts?.length ? 'negative' as const : 'positive' as const,
      icon: AlertTriangle,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-500',
    },
    { 
      label: 'Entradas Hoje', 
      value: todayMovements?.entradas?.toString() || '0', 
      subValue: null,
      change: 'itens recebidos', 
      changeType: 'positive' as const,
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-500',
    },
    { 
      label: 'Saídas Hoje', 
      value: todayMovements?.saidas?.toString() || '0', 
      subValue: null,
      change: 'itens enviados', 
      changeType: 'neutral' as const,
      icon: TrendingDown,
      gradient: 'from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <StatCardsGrid cards={statCards} isLoading={isLoading} />

      {/* Calendar + Category Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCalendar sector="estoque" />
        </div>
        {/* Category Distribution with Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por Categoria</CardTitle>
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
            <div className="space-y-1.5 mt-2">
              {(stockByCategory || []).slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement Chart */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Movimentações da Semana</CardTitle>
              <CardDescription>Entradas vs Saídas (últimos 7 dias)</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementsTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Entradas</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-muted-foreground">Saídas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              Alertas de Estoque ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {alerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className={`p-2 rounded-lg text-xs ${
                  alert.type === 'error' ? 'bg-destructive/20 text-destructive' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                }`}>
                  {alert.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
