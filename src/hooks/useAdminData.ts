import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  code?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  is_active: boolean;
  is_main: boolean;
  created_at?: string;
}

export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  branch_id?: string;
  branch?: Branch;
  color: string;
  is_active: boolean;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  tenant_id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  branch_id?: string;
  team_id?: string;
  is_active: boolean;
  created_at?: string;
  branch?: Branch;
  team?: Team;
  roles?: { role: string }[];
}

// Branches hooks
export function useBranches() {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['admin-branches', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('name');
      if (error) throw error;
      return data as Branch[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();

  return useMutation({
    mutationFn: async (branch: Partial<Branch>) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      const { data, error } = await supabase
        .from('branches')
        .insert({
          name: branch.name || '',
          code: branch.code,
          cnpj: branch.cnpj,
          email: branch.email,
          phone: branch.phone,
          address: branch.address,
          city: branch.city,
          state: branch.state,
          tenant_id: tenant.id,
          is_active: true,
          is_main: branch.is_main ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      toast.success('Filial criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar filial'),
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...branch }: Partial<Branch> & { id: string }) => {
      const { data, error } = await supabase
        .from('branches')
        .update(branch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      toast.success('Filial atualizada com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar filial'),
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      toast.success('Filial removida com sucesso!');
    },
    onError: () => toast.error('Erro ao remover filial'),
  });
}

// Teams hooks
export function useAdminTeams() {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['admin-teams', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          branch:branches(*)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateAdminTeam() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();

  return useMutation({
    mutationFn: async (team: Partial<Team>) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: team.name,
          description: team.description,
          branch_id: team.branch_id,
          color: team.color || '#3b82f6',
          tenant_id: tenant.id,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast.success('Equipe criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar equipe'),
  });
}

export function useUpdateAdminTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...team }: Partial<Team> & { id: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .update({
          name: team.name,
          description: team.description,
          branch_id: team.branch_id,
          color: team.color,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast.success('Equipe atualizada com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar equipe'),
  });
}

export function useDeleteAdminTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast.success('Equipe removida com sucesso!');
    },
    onError: () => toast.error('Erro ao remover equipe'),
  });
}

// Users hooks
export function useAdminUsers() {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['admin-users', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('full_name');
      
      if (profilesError) throw profilesError;

      // Fetch branches
      const { data: allBranches } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenant.id);
      
      // Fetch teams
      const { data: allTeams } = await supabase
        .from('teams')
        .select('*')
        .eq('tenant_id', tenant.id);

      // Fetch roles for all users
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds.length > 0 ? userIds : ['__placeholder__']);
      
      if (rolesError) throw rolesError;

      // Merge data
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        is_active: profile.is_active ?? true,
        branch: allBranches?.find(b => b.id === profile.branch_id) as Branch | undefined,
        team: allTeams?.find(t => t.id === profile.team_id) as Team | undefined,
        roles: roles?.filter(r => r.user_id === profile.id) || [],
      }));

      return usersWithRoles as UserProfile[];
    },
    enabled: !!tenant?.id,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');
      
      // Delete existing roles for this user in this tenant
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('tenant_id', tenant.id);

      // Insert new role using type-safe approach
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          tenant_id: tenant.id,
          role: role as 'admin' | 'manager' | 'superadmin' | 'technician' | 'warehouse' | 'caixa',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Cargo atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar cargo'),
  });
}

export function useUpdateUserBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ branch_id: branchId })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Filial atualizada com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar filial'),
  });
}

export function useUpdateUserTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, teamId }: { userId: string; teamId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ team_id: teamId })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Equipe atualizada com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar equipe'),
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { tenant } = useAuthContext();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      role, 
      branchId, 
      teamId 
    }: { 
      userId: string; 
      role?: string; 
      branchId?: string | null; 
      teamId?: string | null;
    }) => {
      if (!tenant?.id) throw new Error('Tenant não encontrado');

      // Update profile branch and team
      if (branchId !== undefined || teamId !== undefined) {
        const updateData: Record<string, string | null> = {};
        if (branchId !== undefined) updateData.branch_id = branchId;
        if (teamId !== undefined) updateData.team_id = teamId;
        
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
        if (error) throw error;
      }

      // Update role if provided
      if (role) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('tenant_id', tenant.id);

        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            tenant_id: tenant.id,
            role: role as 'admin' | 'manager' | 'superadmin' | 'technician' | 'warehouse' | 'caixa',
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar usuário'),
  });
}
