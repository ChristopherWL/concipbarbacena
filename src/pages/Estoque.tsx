import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEstoque } from '@/hooks/useEstoque';
import { StockCategory, CATEGORY_LABELS } from '@/types/stock';
import { 
  Loader2, 
  HardHat, 
  Shield, 
  Wrench, 
  Boxes, 
  Monitor, 
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  Tooltip,
  XAxis
} from 'recharts';

// ============= CONSTANTS =============

const CATEGORY_ICONS: Record<StockCategory, React.ComponentType<{ className?: string }>> = {
  epi: HardHat,
  epc: Shield,
  ferramentas: Wrench,
  materiais: Boxes,
  equipamentos: Monitor,
};

const CATEGORY_ROUTES: Record<StockCategory, string> = {
  epi: '/estoque/epi',
  epc: '/estoque/epc',
  ferramentas: '/estoque/ferramentas',
  materiais: '/estoque/materiais',
  equipamentos: '/estoque/equipamentos',
};

const CATEGORIES: StockCategory[] = ['epi', 'epc', 'ferramentas', 'materiais', 'equipamentos'];

// ============= MINI CHART COMPONENT =============

interface MiniChartProps {
  data: { date: string; entradas: number; saidas: number }[];
}

function MiniChart({ data }: MiniChartProps) {
  const hasData = data.some(d => d.entradas > 0 || d.saidas > 0);
  
  if (!hasData) {
    return (
      <div className="h-10 flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground/60">Sem movimentação</span>
      </div>
    );
  }
  
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="entradas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="saidas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ 
              background: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '11px',
              padding: '6px 10px'
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
          />
          <Area 
            type="monotone" 
            dataKey="entradas" 
            stroke="hsl(var(--success))" 
            strokeWidth={1.5}
            fill="url(#entradas)" 
            name="Entradas"
          />
          <Area 
            type="monotone" 
            dataKey="saidas" 
            stroke="hsl(var(--destructive))" 
            strokeWidth={1.5}
            fill="url(#saidas)" 
            name="Saídas"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============= CATEGORY CARD COMPONENT =============

interface CategoryCardProps {
  category: StockCategory;
  stats: { total: number; totalStock: number; lowStock: number };
  trend: { date: string; entradas: number; saidas: number }[];
  onClick: () => void;
}

const CategoryCard = ({ category, stats, trend, onClick }: CategoryCardProps) => {
  const Icon = CATEGORY_ICONS[category];
  
  // Calculate trend direction
  const totalEntradas = trend.reduce((acc, d) => acc + d.entradas, 0);
  const totalSaidas = trend.reduce((acc, d) => acc + d.saidas, 0);
  const trendUp = totalEntradas > totalSaidas;
  
  return (
    <Card 
      variant="dashboard"
      onClick={onClick}
      className="min-h-[180px]"
    >
      <CardContent className="p-4 relative z-10 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 group-hover:border-primary/40 group-hover:from-primary/20 transition-all duration-300">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {(totalEntradas > 0 || totalSaidas > 0) && (
            <div className={`flex items-center gap-0.5 text-[10px] font-medium ${trendUp ? 'text-success' : 'text-destructive'}`}>
              {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trendUp ? '+' : '-'}{Math.abs(totalEntradas - totalSaidas)}</span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-0.5">
            {CATEGORY_LABELS[category]}
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.total} produtos • {stats.totalStock} un
          </p>
          {stats.lowStock > 0 && (
            <Badge variant="destructive" className="mt-1.5 text-[10px] px-1.5 py-0">
              {stats.lowStock} em baixa
            </Badge>
          )}
        </div>
        
        <div className="mt-auto pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground/70 mb-1">Últimos 7 dias</p>
          <MiniChart data={trend} />
        </div>
      </CardContent>
    </Card>
  );
};

// ============= MAIN COMPONENT =============

export default function Estoque() {
  const navigate = useNavigate();
  const { 
    statsByCategory, 
    trendsByCategory,
    auditStats, 
    productsLoading,
    zeroStockProducts,
    totalProducts,
    totalStock,
    totalLowStock,
  } = useEstoque();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Gestão de Estoque"
          description="Visão geral do estoque por categoria"
          icon={<Boxes className="h-5 w-5" />}
        />

        {/* Critical Alerts Section */}
        {zeroStockProducts.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <CardTitle className="text-sm font-semibold text-destructive">
                  Alertas Críticos
                </CardTitle>
                <Badge variant="destructive" className="ml-auto text-[10px]">
                  {zeroStockProducts.length} produtos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {zeroStockProducts.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => navigate(CATEGORY_ROUTES[product.category])}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-card/80 border border-destructive/20 hover:border-destructive/40 cursor-pointer transition-colors group"
                  >
                    <div className="p-1.5 rounded-md bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                      <Package className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {product.code} • {CATEGORY_LABELS[product.category]}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive shrink-0">
                      Zerado
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalProducts}</p>
              <p className="text-xs text-muted-foreground">Total de Produtos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/5 to-transparent border-success/20">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{totalStock}</p>
              <p className="text-xs text-muted-foreground">Unidades em Estoque</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-destructive/5 to-transparent border-destructive/20">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{totalLowStock}</p>
              <p className="text-xs text-muted-foreground">Itens em Baixa</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-stagger">
          {CATEGORIES.map((category) => {
            const stats = statsByCategory[category];
            const trend = trendsByCategory[category];
            
            return (
              <CategoryCard
                key={category}
                category={category}
                stats={stats}
                trend={trend}
                onClick={() => navigate(CATEGORY_ROUTES[category])}
              />
            );
          })}

          {/* Auditoria Card */}
          <Card 
            variant="dashboard"
            onClick={() => navigate('/estoque/auditoria')}
            className="min-h-[180px]"
          >
            <CardContent className="p-4 relative z-10 h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 group-hover:border-primary/40 group-hover:from-primary/20 transition-all duration-300">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-0.5">Auditoria</p>
                <p className="text-xs text-muted-foreground">
                  {auditStats.total} registros
                </p>
                {auditStats.pending > 0 && (
                  <Badge className="mt-1.5 text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {auditStats.pending} pendentes
                  </Badge>
                )}
              </div>
              
              <div className="mt-auto pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground/70">
                  Controle de inventário
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading indicator */}
        {productsLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
