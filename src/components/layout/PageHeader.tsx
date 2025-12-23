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
    <div className={cn("relative flex flex-col items-center gap-1.5 py-1", className)}>
      {/* Title with decorative elements */}
      <div className="flex items-center gap-3">
        {/* Left decorative line */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
          <div className="w-6 sm:w-10 h-0.5 bg-primary rounded-full" />
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h1>

        {/* Right decorative line */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 sm:w-10 h-0.5 bg-primary rounded-full" />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
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
