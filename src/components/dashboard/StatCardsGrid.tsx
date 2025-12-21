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
      className={`relative overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group animate-fade-in ${stat.href ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60 group-hover:opacity-80 transition-opacity`} />
      <CardContent className="relative p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            {stat.value !== null && !isLoading ? (
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
            {stat.subValue && (
              <p className={`text-xs flex items-center gap-1 ${stat.subColor || 'text-muted-foreground'}`}>
                <TrendingUp className="h-3 w-3" />
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
          <div className="p-3 rounded-xl bg-card/90 backdrop-blur-sm shadow-md border border-border/30 group-hover:scale-105 transition-transform">
            <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Mobile: 2x2 grid with horizontal scroll */}
      <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3">
          {Array.from({ length: Math.ceil(cards.length / 4) }).map((_, groupIndex) => (
            <div key={groupIndex} className="grid grid-cols-2 gap-3 flex-shrink-0 w-full min-w-[calc(100vw-2rem)]">
              {cards.slice(groupIndex * 4, groupIndex * 4 + 4).map((stat, index) => 
                renderCard(stat, groupIndex * 4 + index)
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: cards don't stretch, fit as many as possible */}
      <div className="hidden md:grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {cards.map((stat, index) => renderCard(stat, index))}
      </div>
    </>
  );
}
