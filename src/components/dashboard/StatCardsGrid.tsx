import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

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

export function StatCardsGrid({ cards, isLoading = false }: StatCardsGridProps) {
  const navigate = useNavigate();

  const renderCard = (stat: StatCard, index: number) => (
    <Card 
      key={stat.label} 
      onClick={() => stat.href && navigate(stat.href)}
      className={`group border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-border/60 transition-all duration-200 ${stat.href ? 'cursor-pointer' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Icon */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
            <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">{stat.label}</p>
            {stat.value !== null && !isLoading ? (
              <p className="text-xl font-semibold text-foreground tabular-nums">{stat.value}</p>
            ) : (
              <Skeleton className="h-7 w-14 ml-auto" />
            )}
          </div>
        </div>
        
        {/* Sub info */}
        {(stat.subValue || stat.subtitle || stat.change) && (
          <div className="mt-3 pt-3 border-t border-border/30">
            {stat.subValue && (
              <p className={`text-xs flex items-center gap-1 ${stat.subColor || 'text-muted-foreground'}`}>
                <span className="truncate">{stat.subValue}</span>
              </p>
            )}
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            )}
            {stat.change && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.changeType === 'positive' ? 'text-success' : 
                stat.changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {stat.changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                {stat.changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                <span className="truncate">{stat.change}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Mobile: 2 columns grid */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        {cards.map((stat, index) => renderCard(stat, index))}
      </div>

      {/* Desktop: responsive grid */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {cards.map((stat, index) => renderCard(stat, index))}
      </div>
    </>
  );
}
