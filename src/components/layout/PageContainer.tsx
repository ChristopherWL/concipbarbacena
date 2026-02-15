import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  withAnimatedBackground?: boolean;
}

/**
 * Container padronizado para páginas com fundo animado futurista
 */
export function PageContainer({ 
  children, 
  className,
  withAnimatedBackground = true 
}: PageContainerProps) {
  return (
    <div className={cn("min-h-screen relative", className)}>
      {withAnimatedBackground && (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
        </div>
      )}
      
      <div className="space-y-4 sm:space-y-6 animate-fade-in relative z-10">
        {children}
      </div>
    </div>
  );
}
