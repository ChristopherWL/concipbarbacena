import { useState, useEffect, memo } from 'react';

interface ClockProps {
  format?: 'time' | 'date' | 'datetime' | 'full-date';
  className?: string;
}

// Isolated clock component to prevent parent re-renders
export const ClockDisplay = memo(function ClockDisplay({ format = 'time', className }: ClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    switch (format) {
      case 'time':
        return currentTime.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
      case 'date':
        return currentTime.toLocaleDateString('pt-BR');
      case 'datetime':
        return `${currentTime.toLocaleDateString('pt-BR')} ${currentTime.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })}`;
      case 'full-date':
        return currentTime.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
      default:
        return currentTime.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
    }
  };

  return <span className={className}>{formatTime()}</span>;
});
