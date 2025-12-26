
-- =====================================================
-- PROFESSIONAL BRANCH ISOLATION - PART 4
-- FUEL_LOGS, MAINTENANCES, PRODUCTS, STOCK_MOVEMENTS
-- =====================================================

-- =====================================================
-- FUEL_LOGS
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage fuel logs" ON public.fuel_logs;
DROP POLICY IF EXISTS "Users can view fuel logs in their tenant" ON public.fuel_logs;
DROP POLICY IF EXISTS "Superadmin can manage all fuel logs" ON public.fuel_logs;

CREATE POLICY "Superadmin can manage all fuel logs"
ON public.fuel_logs
FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view fuel logs in their branch"
ON public.fuel_logs
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Managers can manage fuel logs in their branch"
ON public.fuel_logs
FOR ALL
TO authenticated
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
-- MAINTENANCES
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage maintenances" ON public.maintenances;
DROP POLICY IF EXISTS "Users can view maintenances in their tenant" ON public.maintenances;
DROP POLICY IF EXISTS "Superadmin can manage all maintenances" ON public.maintenances;

CREATE POLICY "Superadmin can manage all maintenances"
ON public.maintenances
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view maintenances in their branch"
ON public.maintenances
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Managers can manage maintenances in their branch"
ON public.maintenances
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
-- PRODUCTS - Limpar duplicatas e unificar políticas
-- =====================================================

DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP POLICY IF EXISTS "Users with stock permission can view products" ON public.products;
DROP POLICY IF EXISTS "Users with stock permission can insert products" ON public.products;
DROP POLICY IF EXISTS "Users with stock permission can update products" ON public.products;
DROP POLICY IF EXISTS "Users with stock permission can delete products" ON public.products;

CREATE POLICY "Superadmin can manage all products"
ON public.products
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view products in their branch"
ON public.products
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users with permission can manage products in their branch"
ON public.products
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'warehouse')
    OR EXISTS (
      SELECT 1 FROM public.user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = products.tenant_id
        AND up.page_stock = true
    )
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- STOCK_MOVEMENTS - Atualizar políticas
-- =====================================================

DROP POLICY IF EXISTS "Users can view stock movements in their branch or all if admin" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert stock movements in their branch" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can update stock movements in their branch" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can delete stock movements in their branch" ON public.stock_movements;
DROP POLICY IF EXISTS "Superadmin can manage all stock movements" ON public.stock_movements;

CREATE POLICY "Superadmin can manage all stock movements"
ON public.stock_movements
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view stock movements in their branch"
ON public.stock_movements
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users with permission can manage stock movements"
ON public.stock_movements
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'warehouse')
    OR EXISTS (
      SELECT 1 FROM public.user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = stock_movements.tenant_id
        AND up.page_stock = true
    )
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);
