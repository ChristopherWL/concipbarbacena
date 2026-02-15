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
<<<<<<< HEAD
  /** Quantidade de cards principais (primeiros N); o restante fica como secundários menores. Padrão 3. */
  primaryCount?: number;
}

const getIconBg = (iconColor: string) => {
  if (iconColor.includes('blue')) return 'bg-blue-500/10';
  if (iconColor.includes('emerald')) return 'bg-emerald-500/10';
  if (iconColor.includes('cyan')) return 'bg-cyan-500/10';
  if (iconColor.includes('amber')) return 'bg-amber-500/10';
  if (iconColor.includes('purple')) return 'bg-purple-500/10';
  if (iconColor.includes('orange')) return 'bg-orange-500/10';
  return 'bg-primary/10';
};

export function StatCardsGrid({ cards, isLoading = false, primaryCount = 3 }: StatCardsGridProps) {
  const navigate = useNavigate();
  const primaryCards = cards.slice(0, primaryCount);
  const secondaryCards = cards.slice(primaryCount);

  const renderCard = (stat: StatCard, size: 'primary' | 'secondary') => {
    const iconBg = getIconBg(stat.iconColor);
    const isPrimary = size === 'primary';
    return (
      <Card
        key={stat.label}
        onClick={() => stat.href && navigate(stat.href)}
        className={cn(
          'stat-card group overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-200',
          'hover:shadow-md hover:border-border',
          stat.href && 'cursor-pointer active:scale-[0.99]'
        )}
      >
        <CardContent
          className={cn(
            'flex flex-col gap-2.5 min-h-0',
            isPrimary ? 'p-4' : 'p-3'
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={cn(
                'flex items-center justify-center rounded-lg shrink-0',
                iconBg,
                isPrimary ? 'w-9 h-9' : 'w-8 h-8'
              )}
            >
              <stat.icon className={cn(isPrimary ? 'h-4 w-4' : 'h-3.5 w-3.5', stat.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-medium text-muted-foreground break-words line-clamp-2 leading-snug',
                  isPrimary ? 'text-xs' : 'text-[11px]'
                )}
              >
                {stat.label}
              </p>
            </div>
            {stat.href && (
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {stat.value !== null && !isLoading ? (
              <p
                className={cn(
                  'font-bold text-foreground tracking-tight tabular-nums',
                  isPrimary ? 'text-xl' : 'text-lg'
                )}
              >
                {stat.value}
              </p>
            ) : (
              <Skeleton className={cn('rounded', isPrimary ? 'h-6 w-14' : 'h-5 w-12')} />
            )}
            {(stat.subValue || stat.subtitle || stat.change) && (
              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                {stat.subValue && (
                  <span className={cn('font-medium', stat.subColor || '')}>
                    {stat.subValue}
                  </span>
                )}
                {stat.subtitle && <span>{stat.subtitle}</span>}
                {stat.change && (
                  <span
                    className={cn(
                      'flex items-center gap-0.5 font-medium',
                      stat.changeType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' :
                      stat.changeType === 'negative' ? 'text-red-600 dark:text-red-400' : ''
                    )}
                  >
                    {stat.changeType === 'positive' && <ArrowUpRight className="h-2.5 w-2.5" />}
                    {stat.changeType === 'negative' && <ArrowDownRight className="h-2.5 w-2.5" />}
                    {stat.change}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const allCards = [
    ...primaryCards.map((stat) => ({ stat, size: 'primary' as const })),
    ...secondaryCards.map((stat) => ({ stat, size: 'secondary' as const })),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {allCards.map(({ stat, size }) => renderCard(stat, size))}
=======
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
      return 'grid-cols-2 max-w-2xl';
    }
    if (cardCount <= 3) {
      return 'grid-cols-2 sm:grid-cols-3 max-w-4xl';
    }
    if (cardCount <= 4) {
      return 'grid-cols-2 md:grid-cols-4 max-w-5xl';
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
      
      <CardContent className="p-3 sm:p-4 relative z-10">
        {/* Icon + Value row */}
        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shrink-0',
            getIconClass(stat.gradient)
          )}>
            <stat.icon className={cn('h-4 w-4 sm:h-5 sm:w-5', stat.iconColor)} />
          </div>
          
          {stat.value !== null && !isLoading ? (
            <p className="text-xl sm:text-2xl font-bold text-foreground data-value leading-none">
              {stat.value}
            </p>
          ) : (
            <Skeleton className="h-6 sm:h-7 w-10 sm:w-12" />
          )}
        </div>
        
        {/* Label */}
        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">
          {stat.label}
        </p>
        
        {/* Sub info */}
        {(stat.subValue || stat.subtitle || stat.change) && (
          <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-border/40">
            {stat.subValue && (
              <span className={cn('text-[9px] sm:text-[10px] font-medium', stat.subColor || 'text-muted-foreground')}>
                {stat.subValue}
              </span>
            )}
            {stat.subtitle && (
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">{stat.subtitle}</span>
            )}
            {stat.change && (
              <div className={cn(
                'flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium ml-auto',
                stat.changeType === 'positive' ? 'text-success' : 
                stat.changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {stat.changeType === 'positive' && <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                {stat.changeType === 'negative' && <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                <span>{stat.change}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('grid gap-2 sm:gap-3', getGridClasses())}>
      {cards.map((stat, index) => renderCard(stat, index))}
>>>>>>> 2b5767b5628a98bf6f9b1410391791e86c127253
    </div>
  );
}
