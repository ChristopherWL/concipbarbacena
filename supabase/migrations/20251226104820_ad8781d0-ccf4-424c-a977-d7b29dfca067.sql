
-- =====================================================
-- PROFESSIONAL BRANCH ISOLATION SYSTEM - PART 1
-- Funções helper para controle de acesso por filial
-- =====================================================

-- 1. FUNÇÃO: Verifica se usuário é da Matriz (branch is_main = true)
CREATE OR REPLACE FUNCTION public.is_matriz_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.branches b ON b.id = p.branch_id OR b.id = p.selected_branch_id
    WHERE p.id = _user_id
      AND b.is_main = true
  )
$$;

-- 2. FUNÇÃO: Verifica se usuário pode ver todas as filiais
-- Retorna true para: superadmin, admin da matriz, manager da matriz
CREATE OR REPLACE FUNCTION public.user_can_see_all_branches(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Superadmin sempre vê tudo
    public.is_superadmin(_user_id)
    OR
    -- Admin ou Manager que está associado à MATRIZ pode ver tudo
    (
      EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = _user_id
          AND ur.role IN ('admin'::public.app_role, 'manager'::public.app_role)
      )
      AND
      EXISTS (
        SELECT 1
        FROM public.profiles p
        LEFT JOIN public.branches b ON b.id = COALESCE(p.branch_id, p.selected_branch_id)
        WHERE p.id = _user_id
          AND (b.is_main = true OR p.branch_id IS NULL)
      )
    )
$$;

-- 3. FUNÇÃO: Retorna o branch_id do usuário (prioriza branch_id sobre selected_branch_id)
CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(branch_id, selected_branch_id)
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- 4. FUNÇÃO: Verifica se usuário pode acessar dados de uma branch específica
CREATE OR REPLACE FUNCTION public.can_access_branch(_user_id uuid, _branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Superadmin acessa tudo
    public.is_superadmin(_user_id)
    OR
    -- Usuário pode ver todas as branches (admin/manager da matriz)
    public.user_can_see_all_branches(_user_id)
    OR
    -- Branch é NULL (dados globais do tenant)
    _branch_id IS NULL
    OR
    -- Usuário está na mesma branch
    public.get_user_branch_id(_user_id) = _branch_id
$$;
