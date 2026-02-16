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
    <div className={cn("relative flex flex-col items-center gap-1", className)}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full bg-primary" />
          <div className="w-3 sm:w-6 md:w-10 h-0.5 bg-primary rounded-full" />
        </div>

        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center">
          {title}
        </h1>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-3 sm:w-6 md:w-10 h-0.5 bg-primary rounded-full" />
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full bg-primary" />
        </div>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {description}
        </p>
      )}

      {children && (
        <div className="flex items-center gap-2 mt-1">
          {children}
        </div>
      )}
    </div>
  );
}