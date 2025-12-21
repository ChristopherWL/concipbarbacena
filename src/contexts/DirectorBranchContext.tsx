import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from './AuthContext';
import { Branch } from '@/types/database';

interface DirectorBranchContextType {
  isDirector: boolean;
  isReadOnly: boolean; // Directors have read-only access
  selectedBranch: Branch | null;
  selectedBranchLogo: string | null;
  availableBranches: Branch[];
  selectBranch: (branch: Branch | null) => void;
  clearSelection: () => void;
  isLoading: boolean;
}

const DirectorBranchContext = createContext<DirectorBranchContextType | undefined>(undefined);

export function DirectorBranchProvider({ children }: { children: ReactNode }) {
  const { user, profile, roles, tenant } = useAuthContext();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedBranchLogo, setSelectedBranchLogo] = useState<string | null>(null);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Director = admin/manager with no branch assigned (selected_branch_id is null)
  // Not superadmin
  const isDirector = !!(
    user &&
    tenant &&
    roles.some(r => r.role === 'admin' || r.role === 'manager') &&
    !roles.some(r => r.role === 'superadmin') &&
    !profile?.selected_branch_id
  );

  // Fetch available branches for the tenant
  useEffect(() => {
    const fetchBranches = async () => {
      if (!tenant?.id || !isDirector) {
        setAvailableBranches([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .order('is_main', { ascending: false })
          .order('name');

        if (error) throw error;
        setAvailableBranches((data as Branch[]) || []);

        // Restore selection from sessionStorage
        const savedBranchId = sessionStorage.getItem('director-selected-branch');
        if (savedBranchId && data) {
          const savedBranch = data.find(b => b.id === savedBranchId);
          if (savedBranch) {
            setSelectedBranch(savedBranch as Branch);
            // Fetch branch logo if exists
            fetchBranchLogo(savedBranch.id);
          }
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [tenant?.id, isDirector]);

  const fetchBranchLogo = async (branchId: string) => {
    // Branches don't have logo directly, but we could use branch-specific assets
    // For now, we'll just set null - the branch name will be shown instead
    setSelectedBranchLogo(null);
  };

  const selectBranch = (branch: Branch | null) => {
    setSelectedBranch(branch);
    if (branch) {
      sessionStorage.setItem('director-selected-branch', branch.id);
      fetchBranchLogo(branch.id);
    } else {
      sessionStorage.removeItem('director-selected-branch');
      setSelectedBranchLogo(null);
    }
  };

  const clearSelection = () => {
    setSelectedBranch(null);
    setSelectedBranchLogo(null);
    sessionStorage.removeItem('director-selected-branch');
  };

  return (
    <DirectorBranchContext.Provider
      value={{
        isDirector,
        isReadOnly: isDirector, // Directors have read-only access
        selectedBranch,
        selectedBranchLogo,
        availableBranches,
        selectBranch,
        clearSelection,
        isLoading,
      }}
    >
      {children}
    </DirectorBranchContext.Provider>
  );
}

export function useDirectorBranch() {
  const context = useContext(DirectorBranchContext);
  if (context === undefined) {
    throw new Error('useDirectorBranch must be used within a DirectorBranchProvider');
  }
  return context;
}
