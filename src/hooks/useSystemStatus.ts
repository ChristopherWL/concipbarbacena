import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemStatus {
  needsSetup: boolean;
  isFreshDatabase: boolean;
  hasSuperadmin: boolean;
  hasTenants: boolean;
  autoCreated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    needsSetup: false,
    isFreshDatabase: false,
    hasSuperadmin: true, // Default to true to avoid flash
    hasTenants: true,
    autoCreated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-system-status');

        if (error) {
          console.error('Error checking system status:', error);
          setStatus(prev => ({
            ...prev,
            isLoading: false,
            error: error.message,
          }));
          return;
        }

        // If superadmin was auto-created, log it
        if (data.auto_created) {
          console.log('Sistema inicializado automaticamente com superadmin padrão');
        }

        setStatus({
          needsSetup: data.needs_setup ?? false,
          isFreshDatabase: data.is_fresh_database ?? false,
          hasSuperadmin: data.has_superadmin ?? true,
          hasTenants: data.has_tenants ?? true,
          autoCreated: data.auto_created ?? false,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Unexpected error checking system status:', error);
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          error: 'Unexpected error',
        }));
      }
    };

    checkStatus();
  }, []);

  return status;
}
