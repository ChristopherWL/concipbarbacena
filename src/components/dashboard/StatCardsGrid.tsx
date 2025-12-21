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
        'futuristic-card glow-accent rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative group',
        stat.href && 'cursor-pointer'
      )}
    >
      {/* Subtle decorative element */}
      <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"
        style={{ background: `linear-gradient(135deg, ${stat.iconColor.includes('blue') ? 'hsl(var(--primary))' : stat.iconColor.includes('emerald') ? 'hsl(142 76% 36%)' : stat.iconColor.includes('amber') ? 'hsl(38 92% 50%)' : stat.iconColor.includes('purple') ? 'hsl(280 85% 65%)' : stat.iconColor.includes('orange') ? 'hsl(25 95% 53%)' : stat.iconColor.includes('cyan') ? 'hsl(186 85% 45%)' : 'hsl(var(--primary))'}, transparent)` }}
      />
      
      <CardContent className="p-3.5 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
            getIconClass(stat.gradient)
          )}>
            <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
          </div>
          
          <div className="flex-1 min-w-0">
            {stat.value !== null && !isLoading ? (
              <p className="text-xl font-bold text-foreground data-value leading-tight">
                {stat.value}
              </p>
            ) : (
              <Skeleton className="h-6 w-14 mb-0.5" />
            )}
            
            <p className="text-[11px] font-medium text-muted-foreground leading-tight truncate">
              {stat.label}
            </p>
          </div>
        </div>
        
        {(stat.subValue || stat.subtitle || stat.change) && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/40">
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((stat, index) => renderCard(stat, index))}
    </div>
  );
}
