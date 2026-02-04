import { Loader2 } from 'lucide-react';

interface PageLoadingProps {
  text?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function PageLoading({ 
  text = 'Carregando', 
  showText = true,
  size = 'md',
  fullScreen = true 
}: PageLoadingProps) {
  const sizeClasses = {
    sm: {
      spinner: 'w-6 h-6',
      text: 'text-sm',
    },
    md: {
      spinner: 'w-10 h-10',
      text: 'text-base',
    },
    lg: {
      spinner: 'w-14 h-14',
      text: 'text-lg',
    },
  };

  const s = sizeClasses[size];

  const content = (
    <div className="flex flex-col items-center gap-4">
      <Loader2 
        className={`${s.spinner} text-primary animate-spin`}
      />
      {showText && (
        <span className={`${s.text} text-muted-foreground font-medium`}>
          {text}...
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      {content}
    </div>
  );
}

// Inline loading spinner for buttons and small areas
export function InlineLoading({ className = '' }: { className?: string }) {
  return (
    <Loader2 className={`w-4 h-4 animate-spin ${className}`} />
  );
}