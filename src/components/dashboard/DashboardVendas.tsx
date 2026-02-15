import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, ShoppingCart, TrendingUp, Users, 
  ArrowUpRight, ArrowDownRight, Package, Receipt
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { DashboardCalendar } from './DashboardCalendar';
import { StatCardsGrid } from './StatCardsGrid';

// Mock data - will be replaced with real data
const salesData = [
  { name: 'Jan', vendas: 45000, pedidos: 120 },
  { name: 'Fev', vendas: 52000, pedidos: 145 },
  { name: 'Mar', vendas: 48000, pedidos: 132 },
  { name: 'Abr', vendas: 61000, pedidos: 168 },
  { name: 'Mai', vendas: 55000, pedidos: 155 },
  { name: 'Jun', vendas: 67000, pedidos: 189 },
];

const topProducts = [
  { name: 'Produto A', vendas: 45, valor: 12500 },
  { name: 'Produto B', vendas: 38, valor: 9800 },
  { name: 'Produto C', vendas: 32, valor: 8200 },
  { name: 'Produto D', vendas: 28, valor: 7100 },
];

export function DashboardVendas() {
  const isLoading = false;

  const statCards = [
    { 
      label: 'Vendas do Mês', 
      value: 'R$ 67.500', 
      change: '+12.5%', 
      changeType: 'positive' as const,
      icon: DollarSign,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-500',
    },
    { 
      label: 'Pedidos', 
      value: '189', 
      change: '+8 hoje', 
      changeType: 'positive' as const,
      icon: ShoppingCart,
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-500',
    },
    { 
      label: 'Ticket Médio', 
      value: 'R$ 357', 
      change: '+5.2%', 
      changeType: 'positive' as const,
      icon: Receipt,
      gradient: 'from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-500',
    },
    { 
      label: 'Clientes Ativos', 
      value: '234', 
      change: '+15 novos', 
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <StatCardsGrid cards={statCards} isLoading={isLoading} />

      {/* Calendar + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCalendar sector="vendas" />
        </div>
        {/* Top Products Panel */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Mais Vendidos
            </CardTitle>
            <CardDescription>Este mês</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.vendas} vendas</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success">
                    R$ {product.valor.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Tendência de Vendas</CardTitle>
                <CardDescription>Faturamento dos últimos 6 meses</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
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
                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Vendas']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorVendas)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos Mais Vendidos
            </CardTitle>
            <CardDescription>Este mês</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.vendas} vendas</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success">
                    R$ {product.valor.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
