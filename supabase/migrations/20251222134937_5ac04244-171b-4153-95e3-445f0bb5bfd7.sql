-- Drop existing policies for suppliers
DROP POLICY IF EXISTS "Managers can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Warehouse can view suppliers in their tenant" ON public.suppliers;
DROP POLICY IF EXISTS "Superadmin can view all suppliers" ON public.suppliers;

-- Create new policies that check user_permissions table
-- Policy for SELECT: users with page_suppliers permission can view
CREATE POLICY "Users with supplier permission can view"
ON public.suppliers
FOR SELECT
USING (
  is_superadmin(auth.uid()) 
  OR (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = auth.uid() 
      AND tenant_id = suppliers.tenant_id 
      AND page_suppliers = true
    )
  )
);

-- Policy for INSERT: users with page_suppliers and can_create permission
CREATE POLICY "Users with supplier permission can insert"
ON public.suppliers
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM user_permissions 
    WHERE user_id = auth.uid() 
    AND tenant_id = suppliers.tenant_id 
    AND page_suppliers = true 
    AND can_create = true
  )
);

-- Policy for UPDATE: users with page_suppliers and can_edit permission
CREATE POLICY "Users with supplier permission can update"
ON public.suppliers
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM user_permissions 
    WHERE user_id = auth.uid() 
    AND tenant_id = suppliers.tenant_id 
    AND page_suppliers = true 
    AND can_edit = true
  )
);

-- Policy for DELETE: users with page_suppliers and can_delete permission
CREATE POLICY "Users with supplier permission can delete"
ON public.suppliers
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM user_permissions 
    WHERE user_id = auth.uid() 
    AND tenant_id = suppliers.tenant_id 
    AND page_suppliers = true 
    AND can_delete = true
  )
);