import { useEffect, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string | null;
  branch_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at: string | null;
  data: Record<string, any> | null;
  created_at: string;
  expires_at: string | null;
}

const NOTIFICATION_PERMISSION_KEY = 'push-notification-permission-asked';

export function useNotifications() {
  const { profile } = useAuthContext();
  const queryClient = useQueryClient();
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  // Check and set initial push permission
  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .or(`user_id.is.null,user_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!profile?.tenant_id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('tenant_id', profile.tenant_id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Request push notification permission
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações push');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
      
      if (permission === 'granted') {
        toast.success('Notificações push ativadas!');
        return true;
      } else if (permission === 'denied') {
        toast.error('Permissão de notificação negada');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/pwa-icons/icon-192x192.png',
      badge: '/pwa-icons/icon-72x72.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent' || notification.priority === 'high',
      silent: false,
    };

    try {
      const browserNotification = new Notification(notification.title, options);
      
      browserNotification.onclick = () => {
        window.focus();
        markAsReadMutation.mutate(notification.id);
        browserNotification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [markAsReadMutation]);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Ignore audio errors
    }
  }, []);

  // Listen for realtime notifications
  useEffect(() => {
    if (!profile?.tenant_id) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Check if notification is for this user or all users
          if (newNotification.user_id === null || newNotification.user_id === profile.id) {
            // Invalidate query to refetch
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            
            // Show in-app toast
            const toastFn = newNotification.type === 'error' ? toast.error :
                           newNotification.type === 'warning' ? toast.warning :
                           newNotification.type === 'success' ? toast.success :
                           toast.info;
            
            toastFn(newNotification.title, {
              description: newNotification.message,
              duration: newNotification.priority === 'urgent' ? 15000 : 
                        newNotification.priority === 'high' ? 10000 : 5000,
            });

            // Show browser notification
            showBrowserNotification(newNotification);
            
            // Play sound for high priority
            if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
              playNotificationSound();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id, profile?.id, queryClient, showBrowserNotification, playNotificationSound]);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasAskedPermission = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'true';

  return {
    notifications,
    isLoading,
    unreadCount,
    pushPermission,
    hasAskedPermission,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    requestPushPermission,
  };
}

// Helper function to create notifications (for use in other parts of the app)
export async function createNotification(params: {
  tenantId: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  userId?: string | null;
  branchId?: string | null;
  data?: Record<string, any>;
}) {
  const { error } = await supabase.from('notifications').insert({
    tenant_id: params.tenantId,
    title: params.title,
    message: params.message,
    type: params.type || 'info',
    priority: params.priority || 'normal',
    user_id: params.userId || null,
    branch_id: params.branchId || null,
    data: params.data || null,
  });

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}
