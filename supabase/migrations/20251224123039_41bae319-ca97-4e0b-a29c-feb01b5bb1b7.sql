-- ===========================================
-- FUNÇÕES AUXILIARES DE SEGURANÇA (SECURITY DEFINER)
-- ===========================================

-- Função para verificar se é superadmin ou admin (nome diferente para não conflitar)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('superadmin', 'admin')
  )
$$;

-- Função para verificar se é gerente de filial (com 1 parâmetro para evitar conflito)
CREATE OR REPLACE FUNCTION public.is_branch_mgr(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('branch_manager', 'manager', 'director')
  )
$$;