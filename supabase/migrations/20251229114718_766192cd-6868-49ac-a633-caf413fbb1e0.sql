
-- Permissões baseadas em user_permissions (admin filial) sem depender de user_roles

CREATE OR REPLACE FUNCTION public.can_user_create(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT can_create FROM public.user_permissions WHERE user_id = p_user_id LIMIT 1),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.can_user_delete(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT can_delete FROM public.user_permissions WHERE user_id = p_user_id LIMIT 1),
    false
  )
$$;

-- Employees: permitir DELETE para superadmin, admin (role) ou quem tem can_delete na filial
DROP POLICY IF EXISTS "Admins can delete employees in their branch" ON public.employees;
CREATE POLICY "Employees delete by permission" ON public.employees
FOR DELETE
USING (
  public.is_superadmin(auth.uid())
  OR (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
    AND public.can_access_branch(auth.uid(), branch_id)
  )
  OR (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.can_user_delete(auth.uid())
    AND public.can_access_branch(auth.uid(), branch_id)
  )
);

-- Service providers: permitir INSERT/UPDATE para superadmin, admin/manager (role) ou quem tem can_create na filial
DROP POLICY IF EXISTS "service_providers_insert" ON public.service_providers;
CREATE POLICY "service_providers_insert" ON public.service_providers
FOR INSERT
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  OR (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'manager'::public.app_role)
    AND public.can_access_branch(auth.uid(), branch_id)
  )
  OR (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.can_user_create(auth.uid())
    AND public.can_access_branch(auth.uid(), branch_id)
  )
);

DROP POLICY IF EXISTS "service_providers_update" ON public.service_providers;
CREATE POLICY "service_providers_update" ON public.service_providers
FOR UPDATE
USING (
  public.is_superadmin(auth.uid())
  OR (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  OR (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'manager'::public.app_role)
    AND public.can_access_branch(auth.uid(), branch_id)
  )
  OR (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.can_user_create(auth.uid())
    AND public.can_access_branch(auth.uid(), branch_id)
  )
);
