import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMatrizBranch } from '@/contexts/MatrizBranchContext';

/**
 * Returns the branch_id to filter data by.
 * - For directors without selection: returns null (sees ALL branches data)
 * - For directors with selection: returns the selected branch
 * - For Matriz users (is_main = true): 
 *   - If they selected a branch via MatrizBranchSelector: returns that branch
 *   - Otherwise: returns null (sees ALL branches data)
 * - For regular branch users: returns the selected branch from their profile
 * - For superadmin: returns null (no filter - sees all data)
 */
export function useBranchFilter() {
  const { selectedBranch: directorBranch, isDirector } = useDirectorBranch();
  const { selectedBranch: userBranch, roles } = useAuthContext();
  const { selectedBranchId: matrizSelectedBranchId } = useMatrizBranch();

  const isSuperAdmin = roles.some(r => r.role === 'superadmin');
  const isMatriz = userBranch?.is_main === true;

  // Superadmin sees all data
  if (isSuperAdmin) {
    return { branchId: null, shouldFilter: false, isDirector: false, isMatriz: false };
  }

  // Directors: when branch selected, filter by that branch; otherwise see all
  if (isDirector) {
    if (directorBranch) {
      return { branchId: directorBranch.id, shouldFilter: true, isDirector: true, isMatriz: false };
    }
    // No branch selected - director sees all data
    return { branchId: null, shouldFilter: false, isDirector: true, isMatriz: false };
  }

  // Matriz users: can select a specific branch to filter, or see all
  if (isMatriz) {
    if (matrizSelectedBranchId) {
      return { branchId: matrizSelectedBranchId, shouldFilter: true, isDirector: false, isMatriz: true };
    }
    // No branch selected - matriz sees all data
    return { branchId: null, shouldFilter: false, isDirector: false, isMatriz: true };
  }

  // Regular users use their assigned branch
  if (userBranch) {
    return { branchId: userBranch.id, shouldFilter: true, isDirector: false, isMatriz: false };
  }

  // No branch filter (admin/manager without branch sees all tenant data)
  return { branchId: null, shouldFilter: false, isDirector: false, isMatriz: false };
}
