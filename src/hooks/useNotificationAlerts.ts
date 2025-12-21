import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Alarm {
  id: string;
  type: 'danger' | 'warning';
  title: string;
  description: string;
  href: string;
}

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const STORAGE_KEY = 'notification-alerts-last-shown';
const SHOWN_ALARMS_KEY = 'notification-alerts-shown-ids';

export function useNotificationAlerts(alarms: Alarm[], tenantId?: string) {
  const previousAlarmsRef = useRef<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Show toast for an alarm
  const showAlarmToast = useCallback((alarm: Alarm) => {
    if (alarm.type === 'danger') {
      toast.error(alarm.title, {
        description: alarm.description,
        duration: 10000,
        action: {
          label: 'Ver',
          onClick: () => {
            window.location.href = alarm.href;
          },
        },
      });
    } else {
      toast.warning(alarm.title, {
        description: alarm.description,
        duration: 8000,
        action: {
          label: 'Ver',
          onClick: () => {
            window.location.href = alarm.href;
          },
        },
      });
    }
  }, []);

  // Show all active alarms
  const showAllAlarms = useCallback((alarmsToShow: Alarm[]) => {
    // Show danger alarms first, then warnings
    const sortedAlarms = [...alarmsToShow].sort((a, b) => {
      if (a.type === 'danger' && b.type !== 'danger') return -1;
      if (a.type !== 'danger' && b.type === 'danger') return 1;
      return 0;
    });

    // Show max 5 alarms to avoid overwhelming the user
    const limitedAlarms = sortedAlarms.slice(0, 5);
    
    limitedAlarms.forEach((alarm, index) => {
      // Stagger the toasts slightly
      setTimeout(() => {
        showAlarmToast(alarm);
      }, index * 500);
    });

    // If there are more alarms, show a summary
    if (sortedAlarms.length > 5) {
      setTimeout(() => {
        toast.info(`+${sortedAlarms.length - 5} outros alertas`, {
          description: 'Clique no sino para ver todos os alertas',
          duration: 5000,
        });
      }, 5 * 500 + 500);
    }
  }, [showAlarmToast]);

  // Check and show periodic alarms (every 12 hours)
  const checkPeriodicAlarms = useCallback(() => {
    if (!tenantId || alarms.length === 0) return;

    const lastShownKey = `${STORAGE_KEY}-${tenantId}`;
    const lastShown = localStorage.getItem(lastShownKey);
    const now = Date.now();

    if (!lastShown || now - parseInt(lastShown) >= TWELVE_HOURS_MS) {
      // Time to show periodic alarms
      showAllAlarms(alarms);
      localStorage.setItem(lastShownKey, now.toString());
    }
  }, [alarms, tenantId, showAllAlarms]);

  // Detect new alarms and show them immediately
  useEffect(() => {
    if (!tenantId || alarms.length === 0) return;

    const currentAlarmIds = alarms.map(a => a.id);
    const previousAlarmIds = previousAlarmsRef.current;

    // Find new alarms that weren't in the previous list
    const newAlarms = alarms.filter(alarm => !previousAlarmIds.includes(alarm.id));

    if (newAlarms.length > 0 && previousAlarmIds.length > 0) {
      // Only show if we already had previous alarms (not initial load)
      newAlarms.forEach((alarm, index) => {
        setTimeout(() => {
          showAlarmToast(alarm);
        }, index * 300);
      });
    }

    // Update previous alarms reference
    previousAlarmsRef.current = currentAlarmIds;
  }, [alarms, tenantId, showAlarmToast]);

  // Initial load - check if we need to show periodic alarms
  useEffect(() => {
    if (!tenantId) return;

    // Small delay to ensure the UI is loaded
    const initialTimeout = setTimeout(() => {
      checkPeriodicAlarms();
    }, 2000);

    return () => clearTimeout(initialTimeout);
  }, [tenantId, checkPeriodicAlarms]);

  // Set up interval to check every 12 hours
  useEffect(() => {
    if (!tenantId) return;

    // Check every minute if 12 hours have passed
    intervalRef.current = setInterval(() => {
      checkPeriodicAlarms();
    }, 60000); // Check every minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tenantId, checkPeriodicAlarms]);

  // Function to manually trigger showing all alarms
  const showAlarmsNow = useCallback(() => {
    if (alarms.length > 0) {
      showAllAlarms(alarms);
      if (tenantId) {
        localStorage.setItem(`${STORAGE_KEY}-${tenantId}`, Date.now().toString());
      }
    }
  }, [alarms, tenantId, showAllAlarms]);

  return { showAlarmsNow };
}
