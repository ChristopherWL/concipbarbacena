import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Technician, Team } from '@/types/teams';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';

export function useTechnicians() {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['technicians', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from('technicians')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name');
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Technician[];
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTechnician() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (tech: Omit<Technician, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      
      const insertData: any = {
        ...tech,
        tenant_id: tenant.id,
      };
      
      // Auto-assign branch_id if filtering by branch
      if (shouldFilter && branchId && !insertData.branch_id) {
        insertData.branch_id = branchId;
      }
      
      const { data, error } = await supabase
        .from('technicians')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Colaborador cadastrado!');
    },
    onError: () => toast.error('Erro ao cadastrar colaborador'),
  });
}

export function useDeleteTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('technicians')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Colaborador removido!');
    },
    onError: () => toast.error('Erro ao remover colaborador'),
  });
}

export function useTeams() {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['teams', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from('teams')
        .select(`
          *,
          leader:technicians!teams_leader_id_fkey(*),
          leader_employee:employees!teams_leader_employee_id_fkey(*),
          vehicle:vehicles(*),
          members:team_members(*, technician:technicians(*), employee:employees(*))
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name');
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (team: { name: string; description?: string; leader_employee_id?: string; vehicle_id?: string; color?: string; branch_id?: string; member_employee_ids?: string[] }) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      
      // Use provided branch_id or default to current filter branch
      const effectiveBranchId = team.branch_id || (shouldFilter && branchId ? branchId : null);
      
      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({
          name: team.name,
          description: team.description,
          leader_employee_id: team.leader_employee_id || null,
          vehicle_id: team.vehicle_id,
          color: team.color || '#3b82f6',
          branch_id: effectiveBranchId,
          tenant_id: tenant.id,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Collect all employee IDs that need to be marked as technicians
      const employeeIdsToMark = [...(team.member_employee_ids || [])];
      if (team.leader_employee_id) {
        employeeIdsToMark.push(team.leader_employee_id);
      }

      // Mark all employees as technicians
      if (employeeIdsToMark.length > 0) {
        await supabase
          .from('employees')
          .update({ is_technician: true })
          .in('id', employeeIdsToMark);
      }

      if (team.member_employee_ids && team.member_employee_ids.length > 0) {
        const members = team.member_employee_ids.map(id => ({ 
          team_id: newTeam.id, 
          employee_id: id,
          technician_id: null as unknown as string // Deprecated field, using employee_id instead
        }));
        await supabase.from('team_members').insert(members);
      }

      return newTeam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Equipe criada!');
    },
    onError: () => toast.error('Erro ao criar equipe'),
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: { id: string; name: string; description?: string; leader_employee_id?: string; vehicle_id?: string; color?: string; member_employee_ids?: string[] }) => {
      // Update team basic info
      const { data: updatedTeam, error } = await supabase
        .from('teams')
        .update({
          name: team.name,
          description: team.description || '',
          leader_employee_id: team.leader_employee_id || null,
          vehicle_id: team.vehicle_id || null,
          color: team.color || '#3b82f6',
        })
        .eq('id', team.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating team:', error);
        throw error;
      }

      // Collect all employee IDs that need to be marked as technicians
      const employeeIdsToMark = [...(team.member_employee_ids || [])];
      if (team.leader_employee_id) {
        employeeIdsToMark.push(team.leader_employee_id);
      }

      // Mark all employees as technicians
      if (employeeIdsToMark.length > 0) {
        const { error: empError } = await supabase
          .from('employees')
          .update({ is_technician: true })
          .in('id', employeeIdsToMark);
        
        if (empError) console.error('Error marking employees as technicians:', empError);
      }

      // Update team members - delete existing and insert new
      const { error: deleteError } = await supabase.from('team_members').delete().eq('team_id', team.id);
      if (deleteError) console.error('Error deleting team members:', deleteError);
      
      if (team.member_employee_ids && team.member_employee_ids.length > 0) {
        const members = team.member_employee_ids.map(id => ({ 
          team_id: team.id, 
          employee_id: id,
          technician_id: null as unknown as string
        }));
        const { error: insertError } = await supabase.from('team_members').insert(members);
        if (insertError) console.error('Error inserting team members:', insertError);
      }

      return updatedTeam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Equipe atualizada!');
    },
    onError: (error: any) => {
      console.error('Team update error:', error);
      toast.error(`Erro ao atualizar equipe: ${error?.message || 'Erro desconhecido'}`);
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete team members
      await supabase.from('team_members').delete().eq('team_id', id);
      // Then soft delete the team
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipe removida!');
    },
    onError: () => toast.error('Erro ao remover equipe'),
  });
}
