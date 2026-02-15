-- Add policy for users with customer permission to insert customers
CREATE POLICY "Users with customer permission can insert customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  (tenant_id = get_user_tenant_id(auth.uid())) AND 
  (EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.user_id = auth.uid()
    AND user_permissions.tenant_id = customers.tenant_id
    AND user_permissions.page_customers = true
    AND user_permissions.can_create = true
  ))
);

-- Add policy for users with customer permission to update customers
CREATE POLICY "Users with customer permission can update customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  (tenant_id = get_user_tenant_id(auth.uid())) AND 
  (EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.user_id = auth.uid()
    AND user_permissions.tenant_id = customers.tenant_id
    AND user_permissions.page_customers = true
    AND user_permissions.can_edit = true
  ))
)
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Add policy for users with customer permission to delete customers
CREATE POLICY "Users with customer permission can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (
  (tenant_id = get_user_tenant_id(auth.uid())) AND 
  (EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.user_id = auth.uid()
    AND user_permissions.tenant_id = customers.tenant_id
    AND user_permissions.page_customers = true
    AND user_permissions.can_delete = true
  ))
);

-- Add policy for users with customer permission to view customers
CREATE POLICY "Users with customer permission can view customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  (tenant_id = get_user_tenant_id(auth.uid())) AND 
  (EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.user_id = auth.uid()
    AND user_permissions.tenant_id = customers.tenant_id
    AND user_permissions.page_customers = true
  ))
);