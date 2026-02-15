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
    </div>
  );
}
