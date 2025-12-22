-- Drop the current policy that restricts INSERT
DROP POLICY IF EXISTS "Managers can manage invoices" ON public.invoices;

-- Create separate policies for better control
-- Policy for SELECT (read)
CREATE POLICY "Users can view invoices in their tenant"
ON public.invoices
FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- Policy for INSERT (create) - allow all authenticated users in tenant
CREATE POLICY "Users can create invoices in their tenant"
ON public.invoices
FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- Policy for UPDATE - allow admin, manager, warehouse or the creator
CREATE POLICY "Users can update invoices in their tenant"
ON public.invoices
FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
    OR public.has_role(auth.uid(), 'warehouse'::public.app_role)
    OR created_by = auth.uid()
  )
);

-- Policy for DELETE - only admin and manager
CREATE POLICY "Admins can delete invoices"
ON public.invoices
FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  )
);

-- Keep superadmin policy
-- Already exists: "Superadmin can view all invoices"