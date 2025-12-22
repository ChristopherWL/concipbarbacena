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
  const cardCount = cards.length;

  // Determine grid columns based on card count for responsive layout
  const getGridClasses = () => {
    if (cardCount <= 2) {
      return 'grid-cols-1 sm:grid-cols-2 max-w-2xl';
    }
    if (cardCount <= 3) {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl';
    }
    if (cardCount <= 4) {
      return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4 max-w-5xl';
    }
    if (cardCount <= 5) {
      return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
    }
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
  };

  const renderCard = (stat: StatCard, index: number) => (
    <Card 
      key={stat.label} 
      onClick={() => stat.href && navigate(stat.href)}
      className={cn(
        'futuristic-card glow-accent rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative group',
        stat.href && 'cursor-pointer'
      )}
    >
      {/* Subtle decorative element */}
      <div className="absolute -right-3 -bottom-3 w-14 h-14 rounded-full opacity-[0.08] group-hover:opacity-[0.15] transition-opacity"
        style={{ background: `linear-gradient(135deg, ${stat.iconColor.includes('blue') ? 'hsl(var(--primary))' : stat.iconColor.includes('emerald') ? 'hsl(142 76% 36%)' : stat.iconColor.includes('amber') ? 'hsl(38 92% 50%)' : stat.iconColor.includes('purple') ? 'hsl(280 85% 65%)' : stat.iconColor.includes('orange') ? 'hsl(25 95% 53%)' : stat.iconColor.includes('cyan') ? 'hsl(186 85% 45%)' : 'hsl(var(--primary))'}, transparent)` }}
      />
      
      <CardContent className="p-4 relative z-10">
        {/* Icon + Value row */}
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
            getIconClass(stat.gradient)
          )}>
            <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
          </div>
          
          {stat.value !== null && !isLoading ? (
            <p className="text-2xl font-bold text-foreground data-value leading-none">
              {stat.value}
            </p>
          ) : (
            <Skeleton className="h-7 w-12" />
          )}
        </div>
        
        {/* Label */}
        <p className="text-xs font-medium text-muted-foreground leading-tight">
          {stat.label}
        </p>
        
        {/* Sub info */}
        {(stat.subValue || stat.subtitle || stat.change) && (
          <div className="flex items-center flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/40">
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
    <div className={cn('grid gap-3', getGridClasses())}>
      {cards.map((stat, index) => renderCard(stat, index))}
    </div>
  );
}
