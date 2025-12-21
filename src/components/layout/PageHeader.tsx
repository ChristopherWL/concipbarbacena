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
    <div className={cn("relative flex flex-col items-center gap-3 py-4", className)}>
      {/* Title with decorative elements */}
      <div className="flex items-center gap-3">
        {/* Left decorative line */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-10 h-0.5 bg-primary rounded-full" />
        </div>

        {/* Icon (optional) */}
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            {icon}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {title}
        </h1>

        {/* Right decorative line */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="w-10 h-0.5 bg-primary rounded-full" />
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {description}
        </p>
      )}

      {/* Action buttons */}
      {children && (
        <div className="flex items-center gap-2 mt-1">
          {children}
        </div>
      )}
    </div>
  );
}
