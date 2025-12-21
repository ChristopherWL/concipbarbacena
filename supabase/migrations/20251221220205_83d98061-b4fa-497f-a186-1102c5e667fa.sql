-- Allow managers to update branches in their tenant (logos, address, etc.)
CREATE POLICY "Managers can manage branches in their tenant"
ON public.branches
AS PERMISSIVE
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.tenant_id = branches.tenant_id
      AND ur.role = 'manager'::public.app_role
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
);