import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-primary rounded-full" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {title}
        </h1>
        <div className="w-8 h-0.5 bg-primary rounded-full" />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground text-center">
          {description}
        </p>
      )}
      {children && (
        <div className="flex items-center gap-2 mt-2">
          {children}
        </div>
      )}
    </div>
  );
}
