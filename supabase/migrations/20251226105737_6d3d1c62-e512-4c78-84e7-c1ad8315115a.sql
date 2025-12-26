
-- =====================================================
-- PROFESSIONAL BRANCH ISOLATION - PART 6
-- DIARIO_OBRAS, DIARIO_SERVICE_ORDERS, SERIAL_NUMBERS, STOCK_AUDITS
-- =====================================================

-- =====================================================
-- DIARIO_OBRAS (já tem filtro de branch, vamos padronizar)
-- =====================================================

DROP POLICY IF EXISTS "Superadmin can manage all diario_obras" ON public.diario_obras;
DROP POLICY IF EXISTS "Users can delete diario_obras in their branch" ON public.diario_obras;
DROP POLICY IF EXISTS "Users can insert diario_obras in their branch" ON public.diario_obras;
DROP POLICY IF EXISTS "Users can update diario_obras in their branch" ON public.diario_obras;
DROP POLICY IF EXISTS "Users can view diario_obras in their branch or all if admin" ON public.diario_obras;

CREATE POLICY "Superadmin can manage all diario_obras"
ON public.diario_obras
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view diario_obras in their branch"
ON public.diario_obras
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users can manage diario_obras in their branch"
ON public.diario_obras
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- DIARIO_SERVICE_ORDERS
-- =====================================================

DROP POLICY IF EXISTS "Users can delete diario in their tenant" ON public.diario_service_orders;
DROP POLICY IF EXISTS "Users can insert diario in their tenant" ON public.diario_service_orders;
DROP POLICY IF EXISTS "Users can update diario in their tenant" ON public.diario_service_orders;
DROP POLICY IF EXISTS "Users can view diario from their tenant" ON public.diario_service_orders;

CREATE POLICY "Superadmin can manage all diario_service_orders"
ON public.diario_service_orders
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view diario_service_orders in their branch"
ON public.diario_service_orders
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users can manage diario_service_orders in their branch"
ON public.diario_service_orders
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- SERIAL_NUMBERS
-- =====================================================

DROP POLICY IF EXISTS "Users can view serial numbers in their tenant" ON public.serial_numbers;
DROP POLICY IF EXISTS "Users can manage serial numbers" ON public.serial_numbers;
DROP POLICY IF EXISTS "Superadmin can manage all serial numbers" ON public.serial_numbers;
DROP POLICY IF EXISTS "Managers can manage serial numbers" ON public.serial_numbers;

CREATE POLICY "Superadmin can manage all serial_numbers"
ON public.serial_numbers
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view serial_numbers in their branch"
ON public.serial_numbers
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users with permission can manage serial_numbers"
ON public.serial_numbers
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'warehouse')
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- STOCK_AUDITS
-- =====================================================

DROP POLICY IF EXISTS "Users can view stock audits in their branch or all if admin" ON public.stock_audits;
DROP POLICY IF EXISTS "Users can insert stock audits in their branch" ON public.stock_audits;
DROP POLICY IF EXISTS "Users can update stock audits in their branch" ON public.stock_audits;
DROP POLICY IF EXISTS "Superadmin can manage all stock audits" ON public.stock_audits;

CREATE POLICY "Superadmin can manage all stock_audits"
ON public.stock_audits
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view stock_audits in their branch"
ON public.stock_audits
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users with permission can manage stock_audits"
ON public.stock_audits
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'warehouse')
    OR reported_by = auth.uid()
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);
