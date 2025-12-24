-- ===========================================
-- FUNÇÕES AUXILIARES DE SEGURANÇA (SECURITY DEFINER)
-- ===========================================

-- Função para verificar se é superadmin ou admin
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

-- Função para verificar se é gerente de filial
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

-- ===========================================
-- RLS POLICIES PARA PROFILES
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- SELECT: superadmin vê todos, gerentes veem da filial, usuários veem próprio
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (public.is_branch_mgr(auth.uid()) AND branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()))
  OR id = auth.uid()
);

-- INSERT: apenas superadmin ou próprio perfil
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR id = auth.uid()
);

-- UPDATE: superadmin todos, gerentes da filial, usuários próprio
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (public.is_branch_mgr(auth.uid()) AND branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()))
  OR id = auth.uid()
);

-- DELETE: apenas superadmin
CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

-- ===========================================
-- RLS POLICIES PARA PRODUCTS
-- ===========================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

-- SELECT: superadmin vê todos, gerentes veem da filial, usuários veem da própria filial
CREATE POLICY "products_select_policy" ON public.products
FOR SELECT TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (public.is_branch_mgr(auth.uid()) AND branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()))
  OR branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
  OR branch_id IS NULL
);

-- INSERT: superadmin ou gerentes
CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.is_branch_mgr(auth.uid())
);

-- UPDATE: superadmin ou gerentes da filial
CREATE POLICY "products_update_policy" ON public.products
FOR UPDATE TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (public.is_branch_mgr(auth.uid()) AND (branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) OR branch_id IS NULL))
);

-- DELETE: apenas superadmin
CREATE POLICY "products_delete_policy" ON public.products
FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

-- ===========================================
-- RLS POLICIES PARA STOCK_MOVEMENTS
-- ===========================================

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_select_policy" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert_policy" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_update_policy" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_delete_policy" ON public.stock_movements;

-- SELECT: superadmin vê todos, gerentes veem da filial, usuários veem da própria filial
CREATE POLICY "stock_movements_select_policy" ON public.stock_movements
FOR SELECT TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (public.is_branch_mgr(auth.uid()) AND branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()))
  OR branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
  OR branch_id IS NULL
);

-- INSERT: superadmin, gerentes ou criador
CREATE POLICY "stock_movements_insert_policy" ON public.stock_movements
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.is_branch_mgr(auth.uid())
  OR created_by = auth.uid()
);

-- UPDATE: superadmin ou gerentes da filial
CREATE POLICY "stock_movements_update_policy" ON public.stock_movements
FOR UPDATE TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (public.is_branch_mgr(auth.uid()) AND branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()))
);

-- DELETE: apenas superadmin
CREATE POLICY "stock_movements_delete_policy" ON public.stock_movements
FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

-- ===========================================
-- RLS POLICIES PARA STOCK_AUDITS
-- ===========================================

ALTER TABLE public.stock_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_audits_select_policy" ON public.stock_audits;
DROP POLICY IF EXISTS "stock_audits_insert_policy" ON public.stock_audits;
DROP POLICY IF EXISTS "stock_audits_update_policy" ON public.stock_audits;
DROP POLICY IF EXISTS "stock_audits_delete_policy" ON public.stock_audits;

-- SELECT: superadmin vê todos, gerentes veem da filial, usuários veem os que criaram
CREATE POLICY "stock_audits_select_policy" ON public.stock_audits
FOR SELECT TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (public.is_branch_mgr(auth.uid()) AND branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()))
  OR reported_by = auth.uid()
);

-- INSERT: qualquer autenticado pode criar
CREATE POLICY "stock_audits_insert_policy" ON public.stock_audits
FOR INSERT TO authenticated
WITH CHECK (
  reported_by = auth.uid()
  OR public.is_super_admin(auth.uid())
  OR public.is_branch_mgr(auth.uid())
);

-- UPDATE: superadmin, gerentes da filial ou quem criou
CREATE POLICY "stock_audits_update_policy" ON public.stock_audits
FOR UPDATE TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (public.is_branch_mgr(auth.uid()) AND branch_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()))
  OR reported_by = auth.uid()
);

-- DELETE: apenas superadmin
CREATE POLICY "stock_audits_delete_policy" ON public.stock_audits
FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));