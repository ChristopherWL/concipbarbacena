import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type StatVariant = 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'default';

interface StatsCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  variant?: StatVariant;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<StatVariant, { card: string; icon: string; value: string }> = {
  primary: {
    card: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40',
    icon: 'bg-primary/15 text-primary',
    value: 'text-primary',
  },
  success: {
    card: 'bg-gradient-to-br from-success/10 to-success/5 border-success/20 hover:border-success/40',
    icon: 'bg-success/15 text-success',
    value: 'text-success',
  },
  warning: {
    card: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hover:border-warning/40',
    icon: 'bg-warning/15 text-warning',
    value: 'text-warning',
  },
  destructive: {
    card: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 hover:border-destructive/40',
    icon: 'bg-destructive/15 text-destructive',
    value: 'text-destructive',
  },
  info: {
    card: 'bg-gradient-to-br from-info/10 to-info/5 border-info/20 hover:border-info/40',
    icon: 'bg-info/15 text-info',
    value: 'text-info',
  },
  default: {
    card: 'bg-gradient-to-br from-muted/50 to-muted/20 border-border hover:border-primary/30',
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
  },
};

/**
 * Card de estatísticas padronizado com gradientes e ícones
 */
export function StatsCard({ 
  value, 
  label, 
  icon: Icon, 
  variant = 'default',
  onClick,
  className 
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card 
      className={cn(
        'transition-all duration-300 cursor-pointer hover:shadow-lg',
        styles.card,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
        {Icon && (
          <div className={cn('p-2 rounded-lg shrink-0', styles.icon)}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn('text-xl sm:text-2xl font-bold truncate', styles.value)}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

/**
 * Grid padronizado para cards de estatísticas
 */
export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const colsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={cn('grid gap-3 animate-stagger', colsClass[columns], className)}>
      {children}
    </div>
  );
}
