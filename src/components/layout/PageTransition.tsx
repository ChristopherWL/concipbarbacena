import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Simple wrapper that applies entrance animation via CSS.
 * Does NOT use key-based remounting to avoid flickering.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="animate-page-enter">
      {children}
    </div>
  );
}
