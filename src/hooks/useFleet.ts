import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, Maintenance, FuelLog } from '@/types/fleet';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';

export function useVehicles() {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['vehicles', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from('vehicles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('plate');
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          ...vehicle,
          tenant_id: tenant.id,
          branch_id: (vehicle as any).branch_id ?? (shouldFilter ? branchId : null),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo cadastrado!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Já existe um veículo com esta placa');
      } else {
        toast.error('Erro ao cadastrar veículo');
      }
    },
  });
}

export function useMaintenances(vehicleId?: string) {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['maintenances', tenant?.id, vehicleId, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from('maintenances')
        .select('*, vehicle:vehicles(*)')
        .eq('tenant_id', tenant.id)
        .order('scheduled_date', { ascending: false });
      
      if (vehicleId) query = query.eq('vehicle_id', vehicleId);
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Maintenance[];
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  const { tenant, user } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (maintenance: Omit<Maintenance, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'vehicle'>) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      const { data, error } = await supabase
        .from('maintenances')
        .insert({ 
          ...maintenance, 
          tenant_id: tenant.id, 
          branch_id: (maintenance as any).branch_id ?? (shouldFilter ? branchId : null),
          created_by: user?.id 
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast.success('Manutenção registrada!');
    },
    onError: () => toast.error('Erro ao registrar manutenção'),
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Maintenance> & { id: string }) => {
      const { error } = await supabase.from('maintenances').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast.success('Manutenção atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar'),
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Vehicle> & { id: string }) => {
      const { error } = await supabase.from('vehicles').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar veículo'),
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo removido!');
    },
    onError: () => toast.error('Erro ao remover veículo'),
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenances')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast.success('Manutenção removida!');
    },
    onError: () => toast.error('Erro ao remover manutenção'),
  });
}

// Fuel Log Hooks
export function useFuelLogs(vehicleId?: string) {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['fuel_logs', tenant?.id, vehicleId, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from('fuel_logs')
        .select('*, vehicle:vehicles(*), supplier:suppliers(id, name)')
        .eq('tenant_id', tenant.id)
        .order('date', { ascending: false });
      
      if (vehicleId) query = query.eq('vehicle_id', vehicleId);
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FuelLog[];
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateFuelLog() {
  const queryClient = useQueryClient();
  const { tenant, user } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (fuelLog: Omit<FuelLog, 'id' | 'tenant_id' | 'created_at' | 'vehicle'>) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      const { data, error } = await supabase
        .from('fuel_logs')
        .insert({ 
          ...fuelLog, 
          tenant_id: tenant.id, 
          branch_id: (fuelLog as any).branch_id ?? (shouldFilter ? branchId : null),
          created_by: user?.id 
        })
        .select()
        .single();
      if (error) throw error;
      
      // Update vehicle km if this fill has higher km
      if (fuelLog.km_at_fill) {
        await supabase
          .from('vehicles')
          .update({ current_km: fuelLog.km_at_fill })
          .eq('id', fuelLog.vehicle_id)
          .lt('current_km', fuelLog.km_at_fill);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel_logs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Abastecimento registrado!');
    },
    onError: () => toast.error('Erro ao registrar abastecimento'),
  });
}

export function useDeleteFuelLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fuel_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel_logs'] });
      toast.success('Abastecimento removido!');
    },
    onError: () => toast.error('Erro ao remover abastecimento'),
  });
}
