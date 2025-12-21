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
    <div className={cn("relative flex flex-col items-center gap-3 py-2", className)}>
      {/* Title with decorative elements */}
      <div className="flex items-center gap-3">
        {/* Left decorative line */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary/60" />
          <div className="w-12 h-0.5 bg-gradient-to-r from-primary/60 to-primary/20 rounded-full" />
        </div>

        {/* Icon (optional) */}
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            {icon}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
          {title}
        </h1>

        {/* Right decorative line */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="w-12 h-0.5 bg-gradient-to-l from-primary/60 to-primary/20 rounded-full" />
          <div className="w-2 h-2 rounded-full bg-primary/60" />
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-md animate-fade-in">
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
