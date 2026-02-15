import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface PushNotificationPromptProps {
  className?: string;
}

export function PushNotificationPrompt({ className }: PushNotificationPromptProps) {
  const { pushPermission, hasAskedPermission, requestPushPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show prompt after a short delay if permission not granted and not asked before
    if (pushPermission === 'default' && !hasAskedPermission && !dismissed) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [pushPermission, hasAskedPermission, dismissed]);

  if (!show || pushPermission !== 'default' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    await requestPushPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300",
        className
      )}
    >
      <div className="bg-card border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">Ativar notificações?</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Receba alertas importantes como vencimentos de manutenção, estoque baixo e atualizações de obras.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={handleEnable} className="h-7 text-xs">
                Ativar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-7 text-xs text-muted-foreground"
              >
                Agora não
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
