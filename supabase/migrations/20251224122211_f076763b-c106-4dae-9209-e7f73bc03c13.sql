-- =====================================================
-- PARTE 2: Funções Auxiliares para Hierarquia
-- =====================================================

-- 1. Função para obter o team_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- 2. Função para verificar se usuário é gerente de filial
CREATE OR REPLACE FUNCTION public.is_branch_manager(_user_id uuid, _branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role IN ('branch_manager'::public.app_role, 'manager'::public.app_role, 'admin'::public.app_role)
      AND (p.branch_id = _branch_id OR public.is_superadmin(_user_id))
  )
$$;

-- 3. Função para verificar se usuário é líder de equipe
CREATE OR REPLACE FUNCTION public.is_team_leader(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams t
    LEFT JOIN public.technicians tech ON tech.id = t.leader_id
    LEFT JOIN public.employees emp ON emp.id = t.leader_employee_id
    WHERE t.id = _team_id
      AND (tech.user_id = _user_id OR emp.user_id = _user_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = 'team_leader'::public.app_role
  )
$$;

-- 4. Função para verificar se usuário pertence a uma equipe específica
CREATE OR REPLACE FUNCTION public.user_belongs_to_team(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _user_id
      AND p.team_id = _team_id
  )
$$;

-- 5. Função para verificar hierarquia completa (super_admin > branch_manager > team_leader > field_user)
CREATE OR REPLACE FUNCTION public.can_access_by_hierarchy(_user_id uuid, _target_branch_id uuid, _target_team_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admin pode tudo
    public.is_superadmin(_user_id)
    OR
    -- Admin do tenant pode tudo no tenant
    public.has_role(_user_id, 'admin'::public.app_role)
    OR
    -- Gerente de filial pode acessar sua filial
    (public.is_branch_manager(_user_id, _target_branch_id) AND _target_branch_id IS NOT NULL)
    OR
    -- Líder de equipe pode acessar sua equipe
    (_target_team_id IS NOT NULL AND public.is_team_leader(_user_id, _target_team_id))
    OR
    -- Usuário de campo pode acessar sua própria equipe
    (_target_team_id IS NOT NULL AND public.user_belongs_to_team(_user_id, _target_team_id))
$$;

-- 6. Comentários
COMMENT ON FUNCTION public.get_user_team_id IS 'Retorna o team_id do usuário';
COMMENT ON FUNCTION public.is_branch_manager IS 'Verifica se o usuário é gerente da filial especificada';
COMMENT ON FUNCTION public.is_team_leader IS 'Verifica se o usuário é líder da equipe especificada';
COMMENT ON FUNCTION public.user_belongs_to_team IS 'Verifica se o usuário pertence à equipe especificada';
COMMENT ON FUNCTION public.can_access_by_hierarchy IS 'Verifica acesso baseado na hierarquia organizacional';