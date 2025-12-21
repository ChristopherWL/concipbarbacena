import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface Alarm {
  id: string;
  type: 'danger' | 'warning';
  title: string;
  description: string;
  href: string;
}

interface NotificationCenterProps {
  alarms?: Alarm[];
}

export function NotificationCenter({ alarms = [] }: NotificationCenterProps) {
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    unreadCount,
    pushPermission,
    hasAskedPermission,
    markAsRead,
    markAllAsRead,
    requestPushPermission,
  } = useNotifications();
  
  const [open, setOpen] = useState(false);

  const totalCount = unreadCount + alarms.length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getAlarmIcon = (type: 'danger' | 'warning') => {
    if (type === 'danger') {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    return <AlertTriangle className="h-4 w-4 text-warning" />;
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    if (priority === 'urgent') {
      return <Badge variant="destructive" className="text-[9px] px-1 py-0">Urgente</Badge>;
    }
    if (priority === 'high') {
      return <Badge variant="outline" className="text-[9px] px-1 py-0 border-warning text-warning">Alta</Badge>;
    }
    return null;
  };

  const hasCriticalAlarms = alarms.some(a => a.type === 'danger');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-sidebar-accent rounded-full">
          <Bell className="h-5 w-5 text-sidebar-foreground/70" />
          {totalCount > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar animate-pulse",
              hasCriticalAlarms ? "bg-destructive" : unreadCount > 0 ? "bg-primary" : "bg-amber-500"
            )} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          <div className="flex items-center gap-1">
            {pushPermission !== 'granted' && !hasAskedPermission && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={requestPushPermission}
              >
                <Bell className="h-3 w-3 mr-1" />
                Ativar Push
              </Button>
            )}
            {pushPermission === 'denied' && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <BellOff className="h-3 w-3" />
                Bloqueado
              </span>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Ler todas
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="alarms" className="w-full">
          <TabsList className="w-full h-8 grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="alarms" className="text-xs data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Alertas {alarms.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{alarms.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Histórico {unreadCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{unreadCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alarms" className="m-0">
            <ScrollArea className="h-[280px]">
              {alarms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <CheckCircle2 className="h-10 w-10 text-success/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Tudo em ordem!</p>
                  <p className="text-xs text-muted-foreground/70">
                    Nenhum alerta no momento
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {alarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        navigate(alarm.href);
                        setOpen(false);
                      }}
                    >
                      <div className="flex gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getAlarmIcon(alarm.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {alarm.title}
                            </p>
                            {alarm.type === 'danger' && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0">Crítico</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {alarm.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notifications" className="m-0">
            <ScrollArea className="h-[280px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Bell className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                  <p className="text-xs text-muted-foreground/70">
                    O histórico aparecerá aqui
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                        !notification.is_read && "bg-primary/5"
                      )}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              "text-sm truncate",
                              !notification.is_read && "font-medium"
                            )}>
                              {notification.title}
                            </p>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground/70">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            {notification.is_read && (
                              <Check className="h-3 w-3 text-muted-foreground/50" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
