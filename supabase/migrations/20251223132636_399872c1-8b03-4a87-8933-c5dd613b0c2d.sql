-- Drop existing delete policy
DROP POLICY IF EXISTS "Admins can delete invoices" ON public.invoices;

-- Create new policy that allows creators to delete their invoices
CREATE POLICY "Users can delete invoices they created or if admin/manager"
ON public.invoices
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'warehouse'::app_role)
    OR created_by = auth.uid()
  )
);