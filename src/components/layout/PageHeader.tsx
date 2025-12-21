import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function PageHeader({ title, description, children, className, icon }: PageHeaderProps) {
  return (
    <div className={cn("relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-6", className)}>
      {/* Left side - Title area */}
      <div className="flex items-center gap-4">
        {/* Icon container with gradient background */}
        {icon && (
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 text-primary shadow-lg shadow-primary/10">
              {icon}
            </div>
          </div>
        )}

        {/* Title and description */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {/* Decorative accent line */}
            <div className="hidden sm:flex items-center gap-1">
              <div className="w-8 h-1 rounded-full bg-gradient-to-r from-primary to-primary/30" />
              <div className="w-2 h-2 rounded-full bg-primary/40" />
            </div>
          </div>
          
          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground max-w-lg">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Right side - Action buttons */}
      {children && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
