import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from './useBranchFilter';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';

export type HierarchyLevel = 'technician' | 'supervisor' | 'manager' | 'director';

interface HierarchyFilterResult {
  level: HierarchyLevel;
  isLoading: boolean;
  // For technician level - their own IDs
  technicianId: string | null;
  employeeId: string | null;
  // For supervisor level - teams they lead
  ledTeamIds: string[];
  // For manager level - branch filter
  branchId: string | null;
  // Helper functions
  isTechnician: boolean;
  isSupervisor: boolean;
  isManager: boolean;
  isDirector: boolean;
}

/**
 * Determines the user's hierarchy level and provides appropriate filter data.
 * 
 * Hierarchy levels:
 * - technician: sees only their own data
 * - supervisor: sees data from all teams they lead
 * - manager: sees data from their branch
 * - director: sees data from all branches (superadmin/admin/director roles)
 */
export function useHierarchyFilter(): HierarchyFilterResult {
  const { user, roles, tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();
  const { isDirector: isDirectorAccess } = useDirectorBranch();

  const isSuperAdmin = roles.some(r => r.role === 'superadmin');
  const isAdmin = roles.some(r => r.role === 'admin');
  const isManagerRole = roles.some(r => r.role === 'manager');

  const { data: hierarchyData, isLoading } = useQuery({
    queryKey: ['user-hierarchy', user?.id, tenant?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) {
        return { technicianId: null, employeeId: null, ledTeamIds: [] };
      }

      // Check if user is linked to an employee
      const { data: employee } = await supabase
        .from('employees')
        .select('id, is_technician')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      // Check if user is linked to a technician directly
      const { data: technician } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      // Get technician ID from direct link or via employee
      let technicianId = technician?.id || null;
      if (!technicianId && employee?.id) {
        const { data: techFromEmployee } = await supabase
          .from('technicians')
          .select('id')
          .eq('employee_id', employee.id)
          .eq('tenant_id', tenant.id)
          .maybeSingle();
        technicianId = techFromEmployee?.id || null;
      }

      // Check if user leads any teams (as technician or employee)
      const ledTeamIds: string[] = [];

      if (technicianId) {
        const { data: ledByTech } = await supabase
          .from('teams')
          .select('id')
          .eq('leader_id', technicianId)
          .eq('tenant_id', tenant.id);
        
        if (ledByTech) {
          ledTeamIds.push(...ledByTech.map(t => t.id));
        }
      }

      if (employee?.id) {
        const { data: ledByEmployee } = await supabase
          .from('teams')
          .select('id')
          .eq('leader_employee_id', employee.id)
          .eq('tenant_id', tenant.id);
        
        if (ledByEmployee) {
          ledTeamIds.push(...ledByEmployee.map(t => t.id));
        }
      }

      return {
        technicianId,
        employeeId: employee?.id || null,
        ledTeamIds: [...new Set(ledTeamIds)], // Remove duplicates
      };
    },
    enabled: !!user?.id && !!tenant?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Determine hierarchy level
  let level: HierarchyLevel = 'technician';

  if (isSuperAdmin || isAdmin || isDirectorAccess) {
    level = 'director';
  } else if (isManagerRole) {
    level = 'manager';
  } else if (hierarchyData?.ledTeamIds && hierarchyData.ledTeamIds.length > 0) {
    level = 'supervisor';
  } else if (hierarchyData?.technicianId || hierarchyData?.employeeId) {
    level = 'technician';
  } else {
    // If no specific role, default to manager level (branch-based)
    level = shouldFilter ? 'manager' : 'director';
  }

  return {
    level,
    isLoading,
    technicianId: hierarchyData?.technicianId || null,
    employeeId: hierarchyData?.employeeId || null,
    ledTeamIds: hierarchyData?.ledTeamIds || [],
    branchId: shouldFilter ? branchId : null,
    isTechnician: level === 'technician',
    isSupervisor: level === 'supervisor',
    isManager: level === 'manager',
    isDirector: level === 'director',
  };
}
