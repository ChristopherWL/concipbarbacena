
-- =====================================================
-- PROFESSIONAL BRANCH ISOLATION - PART 2: EMPLOYEES
-- =====================================================

-- Remove políticas antigas de employees
DROP POLICY IF EXISTS "Managers can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view employees in their tenant" ON public.employees;
DROP POLICY IF EXISTS "User managers can update employees" ON public.employees;

-- Policy SELECT: Usuários veem funcionários da própria filial ou todas se admin/matriz
CREATE POLICY "Users can view employees in their branch"
ON public.employees
FOR SELECT
TO public
USING (
  public.is_superadmin(auth.uid())
  OR
  (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.can_access_branch(auth.uid(), branch_id)
  )
);

-- Policy INSERT: Gerentes podem inserir na própria filial
CREATE POLICY "Managers can insert employees in their branch"
ON public.employees
FOR INSERT
TO public
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR
  (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
    AND public.can_access_branch(auth.uid(), branch_id)
  )
);

-- Policy UPDATE: Gerentes podem atualizar na própria filial
CREATE POLICY "Managers can update employees in their branch"
ON public.employees
FOR UPDATE
TO public
USING (
  public.is_superadmin(auth.uid())
  OR
  (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.can_manage_users_in_tenant(auth.uid(), tenant_id))
    AND public.can_access_branch(auth.uid(), branch_id)
  )
)
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR
  (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.can_access_branch(auth.uid(), branch_id)
  )
);

-- Policy DELETE: Apenas admins podem deletar
CREATE POLICY "Admins can delete employees in their branch"
ON public.employees
FOR DELETE
TO public
USING (
  public.is_superadmin(auth.uid())
  OR
  (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
    AND public.can_access_branch(auth.uid(), branch_id)
  )
);

-- =====================================================
-- OBRAS
-- =====================================================

DROP POLICY IF EXISTS "Superadmin can manage all obras" ON public.obras;
DROP POLICY IF EXISTS "Users can manage obras in their tenant" ON public.obras;
DROP POLICY IF EXISTS "Users can view obras in their tenant" ON public.obras;

CREATE POLICY "Superadmin can manage all obras"
ON public.obras
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view obras in their branch"
ON public.obras
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Managers can manage obras in their branch"
ON public.obras
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  AND public.can_access_branch(auth.uid(), branch_id)
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- TECHNICIANS
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage technicians" ON public.technicians;
DROP POLICY IF EXISTS "Users can view technicians in their tenant" ON public.technicians;
DROP POLICY IF EXISTS "Superadmin can manage all technicians" ON public.technicians;

CREATE POLICY "Superadmin can manage all technicians"
ON public.technicians
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view technicians in their branch"
ON public.technicians
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Managers can manage technicians in their branch"
ON public.technicians
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  AND public.can_access_branch(auth.uid(), branch_id)
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- TEAMS
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams in their tenant" ON public.teams;
DROP POLICY IF EXISTS "Superadmin can manage all teams" ON public.teams;

CREATE POLICY "Superadmin can manage all teams"
ON public.teams
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view teams in their branch"
ON public.teams
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Managers can manage teams in their branch"
ON public.teams
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  AND public.can_access_branch(auth.uid(), branch_id)
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);
