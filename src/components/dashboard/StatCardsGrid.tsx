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
        'futuristic-card glow-accent rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg min-w-[140px]',
        stat.href && 'cursor-pointer'
      )}
    >
      <CardContent className="p-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
            getIconClass(stat.gradient)
          )}>
            <stat.icon className={cn('h-4 w-4', stat.iconColor)} />
          </div>
          
          <div className="flex-1 min-w-0">
            {stat.value !== null && !isLoading ? (
              <p className="text-lg font-bold text-foreground data-value leading-tight">
                {stat.value}
              </p>
            ) : (
              <Skeleton className="h-5 w-12 mb-0.5" />
            )}
            
            <p className="text-[10px] font-medium text-muted-foreground leading-tight truncate">
              {stat.label}
            </p>
          </div>
        </div>
        
        {(stat.subValue || stat.subtitle || stat.change) && (
          <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-border/40">
            {stat.subValue && (
              <span className={cn('text-[9px] font-medium', stat.subColor || 'text-muted-foreground')}>
                {stat.subValue}
              </span>
            )}
            {stat.subtitle && (
              <span className="text-[9px] text-muted-foreground">{stat.subtitle}</span>
            )}
            {stat.change && (
              <div className={cn(
                'flex items-center gap-0.5 text-[9px] font-medium ml-auto',
                stat.changeType === 'positive' ? 'text-success' : 
                stat.changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {stat.changeType === 'positive' && <ArrowUpRight className="h-2.5 w-2.5" />}
                {stat.changeType === 'negative' && <ArrowDownRight className="h-2.5 w-2.5" />}
                <span>{stat.change}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-wrap gap-2.5">
      {cards.map((stat, index) => (
        <div key={stat.label} className="flex-1 min-w-[140px] max-w-[200px]">
          {renderCard(stat, index)}
        </div>
      ))}
    </div>
  );
}
