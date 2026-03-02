import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
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

const ICON_STYLES: Record<string, { bg: string; ring: string }> = {
  blue:    { bg: 'bg-blue-500/12',    ring: 'ring-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/12', ring: 'ring-emerald-500/20' },
  cyan:    { bg: 'bg-cyan-500/12',    ring: 'ring-cyan-500/20' },
  amber:   { bg: 'bg-amber-500/12',   ring: 'ring-amber-500/20' },
  purple:  { bg: 'bg-purple-500/12',  ring: 'ring-purple-500/20' },
  orange:  { bg: 'bg-orange-500/12',  ring: 'ring-orange-500/20' },
};

const getIconStyle = (gradient: string) => {
  for (const key of Object.keys(ICON_STYLES)) {
    if (gradient.includes(key)) return ICON_STYLES[key];
  }
  return { bg: 'bg-primary/12', ring: 'ring-primary/20' };
};

export function StatCardsGrid({ cards, isLoading = false }: StatCardsGridProps) {
  const navigate = useNavigate();
  const cardCount = cards.length;

  const getGridClasses = () => {
    if (cardCount <= 2) return 'grid-cols-2 max-w-2xl';
    if (cardCount <= 3) return 'grid-cols-2 sm:grid-cols-3 max-w-4xl';
    if (cardCount <= 4) return 'grid-cols-2 md:grid-cols-4 max-w-5xl';
    if (cardCount <= 5) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
  };

  const renderCard = (stat: StatCard, index: number) => {
    const iconStyle = getIconStyle(stat.gradient);

    return (
      <Card
        key={stat.label}
        onClick={() => stat.href && navigate(stat.href)}
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-border/40',
          'bg-card shadow-sm',
          'transition-all duration-300 ease-out',
          'hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 hover:border-primary/30',
          stat.href && 'cursor-pointer'
        )}
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Decorative gradient orb */}
        <div
          className={cn(
            'absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            stat.iconColor.replace('text-', 'bg-') + '/20'
          )}
        />

        <CardContent className="relative p-4">
          {/* Icon + Arrow row */}
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl ring-1',
              'transition-transform duration-300 group-hover:scale-110',
              iconStyle.bg,
              iconStyle.ring
            )}>
              <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
            </div>

            {stat.href && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
            )}
          </div>

          {/* Value */}
          <div className="mb-1">
            {stat.value !== null && !isLoading ? (
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
            ) : (
              <Skeleton className="h-7 w-14" />
            )}
          </div>

          {/* Label */}
          <p className="text-xs font-medium text-muted-foreground">
            {stat.label}
          </p>

          {/* Sub info */}
          {(stat.subValue || stat.subtitle || stat.change) && (
            <div className="flex items-center flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/30">
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
                  'flex items-center gap-0.5 text-[10px] font-semibold ml-auto px-1.5 py-0.5 rounded-full',
                  stat.changeType === 'positive' ? 'text-emerald-600 bg-emerald-500/10' :
                  stat.changeType === 'negative' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground'
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
  };

  return (
    <div className={cn('grid gap-3 sm:gap-4', getGridClasses())}>
      {cards.map((stat, index) => renderCard(stat, index))}
    </div>
  );
}
