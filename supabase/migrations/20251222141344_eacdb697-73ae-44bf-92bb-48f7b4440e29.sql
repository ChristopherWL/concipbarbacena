-- Drop existing policies for products
DROP POLICY IF EXISTS "Managers can manage products" ON public.products;
DROP POLICY IF EXISTS "Warehouse can view products in their tenant" ON public.products;
DROP POLICY IF EXISTS "Superadmin can view all products" ON public.products;
DROP POLICY IF EXISTS "Superadmin can manage all products" ON public.products;
DROP POLICY IF EXISTS "Technicians can view products for service orders" ON public.products;
DROP POLICY IF EXISTS "Users with stock permission can view products" ON public.products;
DROP POLICY IF EXISTS "Users with stock permission can insert products" ON public.products;
DROP POLICY IF EXISTS "Users with stock permission can update products" ON public.products;
DROP POLICY IF EXISTS "Users with stock permission can delete products" ON public.products;

-- Create new policies that check user_permissions table
-- Policy for SELECT: users with page_stock permission can view
CREATE POLICY "Users with stock permission can view products"
ON public.products
FOR SELECT
USING (
  is_superadmin(auth.uid()) 
  OR (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = auth.uid() 
      AND tenant_id = products.tenant_id 
      AND (page_stock = true OR page_service_orders = true)
    )
  )
);

-- Policy for INSERT: users with page_stock and can_create permission
CREATE POLICY "Users with stock permission can insert products"
ON public.products
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM user_permissions 
    WHERE user_id = auth.uid() 
    AND tenant_id = products.tenant_id 
    AND page_stock = true
    AND can_create = true
  )
);

-- Policy for UPDATE: users with page_stock and can_edit permission
CREATE POLICY "Users with stock permission can update products"
ON public.products
FOR UPDATE
USING (
  is_superadmin(auth.uid())
  OR (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = auth.uid() 
      AND tenant_id = products.tenant_id 
      AND page_stock = true
      AND can_edit = true
    )
  )
);

-- Policy for DELETE: users with page_stock and can_delete permission
CREATE POLICY "Users with stock permission can delete products"
ON public.products
FOR DELETE
USING (
  is_superadmin(auth.uid())
  OR (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = auth.uid() 
      AND tenant_id = products.tenant_id 
      AND page_stock = true
      AND can_delete = true
    )
  )
);