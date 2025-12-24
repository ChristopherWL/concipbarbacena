import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { Product } from '@/types/stock';
import { formatCurrency } from '@/lib/formatters';

// ============= TYPES =============

export interface EstoqueStatsProps {
  products: Product[];
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'success';
}

// ============= STAT CARD =============

const StatCard = memo(function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon,
  variant = 'default' 
}: StatCardProps) {
  const variantStyles = {
    default: 'from-primary/10 to-primary/5 border-primary/10',
    warning: 'from-amber-500/10 to-amber-500/5 border-amber-500/10',
    success: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/10',
  };

  const iconVariantStyles = {
    default: 'text-primary',
    warning: 'text-amber-500',
    success: 'text-emerald-500',
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${variantStyles[variant]} border`}>
            <div className={iconVariantStyles[variant]}>
              {icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className="text-lg font-semibold text-foreground truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ============= MAIN COMPONENT =============

export const EstoqueStats = memo(function EstoqueStats({ 
  products,
  isLoading = false 
}: EstoqueStatsProps) {
  // Memoized stats calculation
  const stats = useMemo(() => {
    const totalItems = products.length;
    const totalStock = products.reduce((acc, p) => acc + (p.current_stock || 0), 0);
    const totalValue = products.reduce((acc, p) => {
      const stock = p.current_stock || 0;
      const price = p.cost_price || 0;
      return acc + (stock * price);
    }, 0);
    const lowStockItems = products.filter(p => 
      (p.current_stock || 0) <= (p.min_stock || 0)
    ).length;

    return {
      totalItems,
      totalStock,
      totalValue,
      lowStockItems,
    };
  }, [products]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-5 w-12 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        title="Total de Produtos"
        value={stats.totalItems}
        subtitle={`${stats.totalStock} unidades`}
        icon={<Package className="h-5 w-5" />}
      />
      <StatCard
        title="Valor em Estoque"
        value={formatCurrency(stats.totalValue)}
        icon={<DollarSign className="h-5 w-5" />}
        variant="success"
      />
      <StatCard
        title="Estoque Baixo"
        value={stats.lowStockItems}
        subtitle={stats.lowStockItems > 0 ? 'Requer atenção' : 'Tudo em ordem'}
        icon={<TrendingDown className="h-5 w-5" />}
        variant={stats.lowStockItems > 0 ? 'warning' : 'default'}
      />
      <StatCard
        title="Alertas"
        value={stats.lowStockItems > 0 ? stats.lowStockItems : 'Nenhum'}
        icon={<AlertTriangle className="h-5 w-5" />}
        variant={stats.lowStockItems > 0 ? 'warning' : 'default'}
      />
    </div>
  );
});
