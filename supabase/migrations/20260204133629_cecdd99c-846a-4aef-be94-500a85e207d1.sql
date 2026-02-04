-- Recreate INSERT policy with proper table references
CREATE POLICY "Users with HR permission can insert employees"
ON public.employees
FOR INSERT
WITH CHECK (
  -- Superadmin can do anything
  is_superadmin(auth.uid())
  OR
  (
    -- Must be in same tenant
    employees.tenant_id = get_user_tenant_id(auth.uid())
    AND
    -- Must have branch access
    can_access_branch(auth.uid(), employees.branch_id)
    AND
    (
      -- Admin or manager role
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
      OR
      -- Or has page_hr permission with can_create
      EXISTS (
        SELECT 1 FROM public.user_permissions up
        WHERE up.user_id = auth.uid()
          AND up.tenant_id = employees.tenant_id
          AND COALESCE(up.page_hr, false) = true
          AND COALESCE(up.can_create, false) = true
      )
      OR
      -- Or has permission via template
      EXISTS (
        SELECT 1 FROM public.user_permissions up
        JOIN public.permission_templates pt ON pt.id = up.template_id
        WHERE up.user_id = auth.uid()
          AND up.tenant_id = employees.tenant_id
          AND COALESCE(pt.page_hr, false) = true
          AND COALESCE(pt.is_active, true) = true
          AND COALESCE(up.can_create, false) = true
      )
    )
  )
);