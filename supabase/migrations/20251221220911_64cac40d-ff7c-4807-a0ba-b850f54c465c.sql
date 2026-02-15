-- 1) Permission helper: can edit branch settings (logos, address, etc.)
CREATE OR REPLACE FUNCTION public.can_edit_branch_settings(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_superadmin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.tenant_id = _tenant_id
        AND ur.role IN ('admin'::public.app_role, 'manager'::public.app_role)
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_permissions up
      WHERE up.user_id = _user_id
        AND up.tenant_id = _tenant_id
        AND COALESCE(up.page_settings, false) = true
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_permissions up
      JOIN public.permission_templates pt ON pt.id = up.template_id
      WHERE up.user_id = _user_id
        AND up.tenant_id = _tenant_id
        AND COALESCE(pt.page_settings, false) = true
        AND COALESCE(pt.is_active, true) = true
    );
$$;

-- 2) Policy: users with settings permission can UPDATE branches in their tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'branches'
      AND policyname = 'Users with settings permission can update branches'
  ) THEN
    EXECUTE 'CREATE POLICY "Users with settings permission can update branches"
      ON public.branches
      AS PERMISSIVE
      FOR UPDATE
      TO public
      USING (
        tenant_id = public.get_user_tenant_id(auth.uid())
        AND public.can_edit_branch_settings(auth.uid(), tenant_id)
      )
      WITH CHECK (
        tenant_id = public.get_user_tenant_id(auth.uid())
      )';
  END IF;
END $$;