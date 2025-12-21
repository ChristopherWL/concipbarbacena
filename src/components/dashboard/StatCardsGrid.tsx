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
        'futuristic-card glow-accent rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
        stat.href && 'cursor-pointer'
      )}
    >
      <CardContent className="p-4 relative z-10">
        {/* Content row: Icon + Info */}
        <div className="flex items-center gap-3">
          {/* Icon container */}
          <div className={cn(
            'flex items-center justify-center w-11 h-11 rounded-xl shrink-0',
            getIconClass(stat.gradient)
          )}>
            <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Value */}
            {stat.value !== null && !isLoading ? (
              <p className="text-xl font-bold text-foreground data-value leading-tight">
                {stat.value}
              </p>
            ) : (
              <Skeleton className="h-6 w-14 mb-1" />
            )}
            
            {/* Label */}
            <p className="text-[11px] font-medium text-muted-foreground leading-tight truncate">
              {stat.label}
            </p>
          </div>
        </div>
        
        {/* Sub info */}
        {(stat.subValue || stat.subtitle || stat.change) && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
            {stat.subValue && (
              <span className={cn('text-[10px] font-medium', stat.subColor || 'text-muted-foreground')}>
                {stat.subValue}
              </span>
            )}
            {stat.subtitle && (
              <span className="text-[10px] text-muted-foreground">{stat.subtitle}</span>
            )}
            {stat.change && (
              <div className={cn(
                'flex items-center gap-0.5 text-[10px] font-medium ml-auto',
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
