import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
<<<<<<< HEAD
  /** Estilo mais limpo para dashboard (sem linhas decorativas, alinhamento à esquerda) */
  variant?: 'default' | 'dashboard';
}

export function PageHeader({ title, description, children, className, icon, variant = 'default' }: PageHeaderProps) {
  if (variant === 'dashboard') {
    return (
      <header className={cn("dashboard-header", className)}>
        <div className="flex flex-col items-center text-center gap-3">
          {icon && (
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-xl">
              {description}
            </p>
          )}
          {children && (
            <div className="flex items-center justify-center gap-2 flex-shrink-0">
              {children}
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <div className={cn("relative flex flex-col items-center gap-1", className)}>
      <div className="flex items-center gap-2 sm:gap-3">
=======
}

export function PageHeader({ title, description, children, className, icon }: PageHeaderProps) {
  return (
    <div className={cn("relative flex flex-col items-center gap-1", className)}>
      {/* Title with decorative elements */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Left decorative line */}
>>>>>>> 2b5767b5628a98bf6f9b1410391791e86c127253
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full bg-primary" />
          <div className="w-3 sm:w-6 md:w-10 h-0.5 bg-primary rounded-full" />
        </div>
<<<<<<< HEAD
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center">
          {title}
        </h1>
=======

        {/* Title */}
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center">
          {title}
        </h1>

        {/* Right decorative line */}
>>>>>>> 2b5767b5628a98bf6f9b1410391791e86c127253
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-3 sm:w-6 md:w-10 h-0.5 bg-primary rounded-full" />
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full bg-primary" />
        </div>
      </div>
<<<<<<< HEAD
=======

      {/* Description */}
>>>>>>> 2b5767b5628a98bf6f9b1410391791e86c127253
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {description}
        </p>
      )}
<<<<<<< HEAD
=======

      {/* Action buttons */}
>>>>>>> 2b5767b5628a98bf6f9b1410391791e86c127253
      {children && (
        <div className="flex items-center gap-2 mt-1">
          {children}
        </div>
      )}
    </div>
  );
}
