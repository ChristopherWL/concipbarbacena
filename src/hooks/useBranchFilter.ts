import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMatrizBranch } from '@/contexts/MatrizBranchContext';

/**
 * Returns the branch_id to filter data by.
 * - For superadmin: returns null (no filter - sees all data)
 * - For directors without selection: returns null (sees ALL branches data)
 * - For directors with selection: returns the selected branch
 * - For Matriz users (is_main = true): 
 *   - If they selected a branch via MatrizBranchSelector: returns that branch
 *   - Otherwise: returns null (sees ALL branches data)
 * - For regular branch users: MUST have a branch assigned - returns that branch
 * - For users without branch: should NOT see any data (returns impossible filter)
 */
export function useBranchFilter() {
  const { selectedBranch: directorBranch, isDirector } = useDirectorBranch();
  const { selectedBranch: userBranch, roles, profile } = useAuthContext();
  const { selectedBranchId: matrizSelectedBranchId } = useMatrizBranch();

  const isSuperAdmin = roles.some(r => r.role === 'superadmin');
  const isAdmin = roles.some(r => r.role === 'admin');
  const isManager = roles.some(r => r.role === 'manager');
  const isMatriz = userBranch?.is_main === true;

  // Superadmin sees all data
  if (isSuperAdmin) {
    return { branchId: null, shouldFilter: false, isDirector: false, isMatriz: false };
  }

  // Admin users at Matriz level can see all data
  if (isAdmin && isMatriz) {
    if (matrizSelectedBranchId) {
      return { branchId: matrizSelectedBranchId, shouldFilter: true, isDirector: false, isMatriz: true };
    }
    return { branchId: null, shouldFilter: false, isDirector: false, isMatriz: true };
  }

  // Directors: when branch selected, filter by that branch; otherwise see all
  if (isDirector) {
    if (directorBranch) {
      return { branchId: directorBranch.id, shouldFilter: true, isDirector: true, isMatriz: false };
    }
    // No branch selected - director sees all data
    return { branchId: null, shouldFilter: false, isDirector: true, isMatriz: false };
  }

  // Matriz users (manager level): can select a specific branch to filter, or see all
  if (isMatriz && isManager) {
    if (matrizSelectedBranchId) {
      return { branchId: matrizSelectedBranchId, shouldFilter: true, isDirector: false, isMatriz: true };
    }
    // No branch selected - matriz manager sees all data
    return { branchId: null, shouldFilter: false, isDirector: false, isMatriz: true };
  }

  // Regular users with assigned branch - MUST filter by their branch
  if (userBranch && !userBranch.is_main) {
    return { branchId: userBranch.id, shouldFilter: true, isDirector: false, isMatriz: false };
  }

  // Users at Matriz branch (regular users, not admin/manager) - can see Matriz data only
  if (userBranch && userBranch.is_main) {
    return { branchId: userBranch.id, shouldFilter: true, isDirector: false, isMatriz: false };
  }

  // CRITICAL: Users without a branch assignment should NOT see all data
  // Return a filter that effectively blocks access to prevent data leakage
  // They need to have their branch_id set in their profile
  if (profile?.branch_id) {
    // Profile has branch_id but userBranch wasn't loaded - use the ID directly
    return { branchId: profile.branch_id, shouldFilter: true, isDirector: false, isMatriz: false };
  }

  // No branch assigned - this user needs to be assigned to a branch
  // Return a dummy UUID that won't match any real branch to prevent data access
  console.warn('User has no branch assigned - data access restricted');
  return { branchId: '00000000-0000-0000-0000-000000000000', shouldFilter: true, isDirector: false, isMatriz: false };
}
