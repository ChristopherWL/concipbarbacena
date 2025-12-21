import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCard {
  label: string;
  value: string | number | null;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  href?: string;
  subValue?: string | null;
  subColor?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}

interface StatCardsGridProps {
  cards: StatCard[];
  isLoading?: boolean;
}

const getIconClass = (gradient: string) => {
  if (gradient.includes('blue')) return 'metric-icon-blue';
  if (gradient.includes('emerald')) return 'metric-icon-emerald';
  if (gradient.includes('cyan')) return 'metric-icon-cyan';
  if (gradient.includes('amber')) return 'metric-icon-amber';
  if (gradient.includes('purple')) return 'metric-icon-purple';
  if (gradient.includes('orange')) return 'metric-icon-orange';
  return 'metric-icon';
};

export function StatCardsGrid({ cards, isLoading = false }: StatCardsGridProps) {
  const navigate = useNavigate();

  const renderCard = (stat: StatCard, index: number) => (
    <Card 
      key={stat.label} 
      onClick={() => stat.href && navigate(stat.href)}
      className={cn(
        'futuristic-card glow-accent rounded-xl',
        stat.href && 'cursor-pointer'
      )}
    >
      <CardContent className="p-4 relative z-10">
        {/* Top row: Label + Icon */}
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {stat.label}
          </p>
          <div className={cn('metric-icon', getIconClass(stat.gradient))}>
            <stat.icon className={cn('h-4 w-4', stat.iconColor)} />
          </div>
        </div>
        
        {/* Value */}
        {stat.value !== null && !isLoading ? (
          <p className="text-2xl font-bold text-foreground data-value mb-1">
            {stat.value}
          </p>
        ) : (
          <Skeleton className="h-8 w-20 mb-1" />
        )}
        
        {/* Sub info */}
        {(stat.subValue || stat.subtitle || stat.change) && (
          <div className="flex items-center gap-2 mt-2">
            {stat.subValue && (
              <span className={cn('text-xs font-medium', stat.subColor || 'text-muted-foreground')}>
                {stat.subValue}
              </span>
            )}
            {stat.subtitle && (
              <span className="text-xs text-muted-foreground">{stat.subtitle}</span>
            )}
            {stat.change && (
              <div className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                stat.changeType === 'positive' ? 'text-success' : 
                stat.changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {stat.changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                {stat.changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                <span>{stat.change}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((stat, index) => renderCard(stat, index))}
    </div>
  );
}
