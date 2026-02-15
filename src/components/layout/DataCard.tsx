import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { cn } from '@/lib/utils';
import { Search, Plus, LucideIcon } from 'lucide-react';

interface DataCardHeaderProps {
  title: string;
  description?: string;
  count?: { filtered: number; total: number };
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  primaryAction?: {
    label: string;
    mobileLabel?: string;
    icon?: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
  };
}

interface DataCardProps {
  children: React.ReactNode;
  header?: DataCardHeaderProps;
  isLoading?: boolean;
  loadingColumns?: number;
  loadingRows?: number;
  className?: string;
  contentClassName?: string;
}

/**
 * Card padronizado para exibição de dados com header integrado
 */
export function DataCard({
  children,
  header,
  isLoading = false,
  loadingColumns = 6,
  loadingRows = 5,
  className,
  contentClassName,
}: DataCardProps) {
  return (
    <Card className={cn(
      'overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 shadow-lg',
      className
    )}>
      {header && (
        <CardHeader className="border-b bg-muted/30 py-3 px-3 sm:px-6">
          {/* Mobile Layout */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{header.title}</CardTitle>
                {header.count && (
                  <CardDescription className="text-xs">
                    {header.count.filtered} de {header.count.total}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {header.actions}
                {header.primaryAction && (
                  <Button 
                    onClick={header.primaryAction.onClick} 
                    size="sm"
                    disabled={header.primaryAction.disabled}
                  >
                    {header.primaryAction.icon && (
                      <header.primaryAction.icon className="h-4 w-4 mr-1" />
                    )}
                    {header.primaryAction.mobileLabel || header.primaryAction.label}
                  </Button>
                )}
              </div>
            </div>
            {header.onSearchChange && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={header.searchPlaceholder || 'Buscar...'}
                  value={header.searchValue}
                  onChange={(e) => header.onSearchChange?.(e.target.value)}
                  className="h-9 text-sm pl-9"
                />
              </div>
            )}
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">{header.title}</CardTitle>
              {header.count && (
                <CardDescription>
                  {header.count.filtered} de {header.count.total} itens
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {header.onSearchChange && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={header.searchPlaceholder || 'Buscar por código ou nome...'}
                    value={header.searchValue}
                    onChange={(e) => header.onSearchChange?.(e.target.value)}
                    className="w-64 pl-9"
                  />
                </div>
              )}
              {header.actions}
              {header.primaryAction && (
                <Button 
                  onClick={header.primaryAction.onClick} 
                  size="sm"
                  disabled={header.primaryAction.disabled}
                >
                  {header.primaryAction.icon && (
                    <header.primaryAction.icon className="h-4 w-4 mr-2" />
                  )}
                  {header.primaryAction.label}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn('p-0', contentClassName)}>
        {isLoading ? (
          <TableSkeleton columns={loadingColumns} rows={loadingRows} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
