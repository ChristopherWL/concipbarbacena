import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMatrizBranch } from '@/contexts/MatrizBranchContext';

/**
 * PROFESSIONAL BRANCH ISOLATION SYSTEM
 * 
 * Regras de acesso por nível hierárquico:
 * 
 * 1. SuperAdmin: vê TUDO (todas as empresas, todas as filiais)
 * 2. Admin da Matriz: vê TODAS as filiais do tenant (pode filtrar opcionalmente)
 * 3. Manager da Matriz: vê TODAS as filiais do tenant (pode filtrar opcionalmente)
 * 4. Diretor: vê TODAS as filiais do tenant (pode filtrar opcionalmente)
 * 5. Admin/Manager de Filial: vê APENAS dados da própria filial
 * 6. Usuário Regular: vê APENAS dados da filial atribuída
 * 7. Usuário sem filial: BLOQUEADO (não vê nada)
 * 
 * IMPORTANTE: As políticas RLS no banco de dados também aplicam estas regras.
 * Este hook é usado para otimizar queries no frontend.
 */

export interface BranchFilterResult {
  branchId: string | null;
  shouldFilter: boolean;
  isDirector: boolean;
  isMatriz: boolean;
  canSeeAllBranches: boolean;
}

export function useBranchFilter(): BranchFilterResult {
  const { selectedBranch: directorBranch, isDirector } = useDirectorBranch();
  const { selectedBranch: userBranch, roles, profile } = useAuthContext();
  const { selectedBranchId: matrizSelectedBranchId } = useMatrizBranch();

  const isSuperAdmin = roles.some(r => r.role === 'superadmin');
  const isAdmin = roles.some(r => r.role === 'admin');
  const isManager = roles.some(r => r.role === 'manager');
  
  // Verifica se o usuário está na Matriz (branch principal)
  const isMatriz = userBranch?.is_main === true || profile?.branch_id === null;

  // ============================================
  // NÍVEL 1: SuperAdmin - acesso total
  // ============================================
  if (isSuperAdmin) {
    return { 
      branchId: null, 
      shouldFilter: false, 
      isDirector: false, 
      isMatriz: false,
      canSeeAllBranches: true 
    };
  }

  // ============================================
  // NÍVEL 2: Admin da Matriz - vê todas as filiais
  // ============================================
  if (isAdmin && isMatriz) {
    // Pode filtrar por uma filial específica se selecionada, mas por padrão vê tudo
    if (matrizSelectedBranchId) {
      return { 
        branchId: matrizSelectedBranchId, 
        shouldFilter: true, 
        isDirector: false, 
        isMatriz: true,
        canSeeAllBranches: true 
      };
    }
    return { 
      branchId: null, 
      shouldFilter: false, 
      isDirector: false, 
      isMatriz: true,
      canSeeAllBranches: true 
    };
  }

  // ============================================
  // NÍVEL 3: Diretor - vê todas as filiais
  // ============================================
  if (isDirector) {
    if (directorBranch) {
      return { 
        branchId: directorBranch.id, 
        shouldFilter: true, 
        isDirector: true, 
        isMatriz: false,
        canSeeAllBranches: true 
      };
    }
    return { 
      branchId: null, 
      shouldFilter: false, 
      isDirector: true, 
      isMatriz: false,
      canSeeAllBranches: true 
    };
  }

  // ============================================
  // NÍVEL 4: Manager da Matriz - vê todas as filiais
  // ============================================
  if (isManager && isMatriz) {
    if (matrizSelectedBranchId) {
      return { 
        branchId: matrizSelectedBranchId, 
        shouldFilter: true, 
        isDirector: false, 
        isMatriz: true,
        canSeeAllBranches: true 
      };
    }
    return { 
      branchId: null, 
      shouldFilter: false, 
      isDirector: false, 
      isMatriz: true,
      canSeeAllBranches: true 
    };
  }

  // ============================================
  // NÍVEL 5: Admin/Manager de Filial específica
  // Vê APENAS dados da própria filial
  // ============================================
  if ((isAdmin || isManager) && userBranch && !userBranch.is_main) {
    return { 
      branchId: userBranch.id, 
      shouldFilter: true, 
      isDirector: false, 
      isMatriz: false,
      canSeeAllBranches: false 
    };
  }

  // ============================================
  // NÍVEL 6: Usuário regular com filial atribuída
  // Vê APENAS dados da própria filial
  // ============================================
  if (userBranch) {
    return { 
      branchId: userBranch.id, 
      shouldFilter: true, 
      isDirector: false, 
      isMatriz: userBranch.is_main === true,
      canSeeAllBranches: false 
    };
  }

  // Fallback: tenta usar branch_id do profile
  if (profile?.branch_id) {
    return { 
      branchId: profile.branch_id, 
      shouldFilter: true, 
      isDirector: false, 
      isMatriz: false,
      canSeeAllBranches: false 
    };
  }

  // ============================================
  // NÍVEL 7: Usuário sem filial - BLOQUEADO
  // Retorna UUID inválido para garantir que não veja nada
  // As políticas RLS também bloqueiam no backend
  // ============================================
  console.warn('[useBranchFilter] Usuário sem filial atribuída - acesso bloqueado');
  return { 
    branchId: '00000000-0000-0000-0000-000000000000', 
    shouldFilter: true, 
    isDirector: false, 
    isMatriz: false,
    canSeeAllBranches: false 
  };
}
