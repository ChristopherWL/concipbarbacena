
-- =====================================================
-- PROFESSIONAL BRANCH ISOLATION - PART 3 (CORRIGIDO)
-- VEHICLES, SERVICE_ORDERS, SUPPLIERS, INVOICES
-- =====================================================

-- =====================================================
-- VEHICLES (já foi criado no rollback parcial, recriar)
-- =====================================================

DROP POLICY IF EXISTS "Superadmin can manage all vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can view vehicles in their branch" ON public.vehicles;
DROP POLICY IF EXISTS "Managers can manage vehicles in their branch" ON public.vehicles;

CREATE POLICY "Superadmin can manage all vehicles"
ON public.vehicles
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view vehicles in their branch"
ON public.vehicles
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Managers can manage vehicles in their branch"
ON public.vehicles
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
-- SERVICE_ORDERS (corrigido: field_user em vez de field)
-- =====================================================

DROP POLICY IF EXISTS "Superadmin can manage all service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can view service orders in their branch" ON public.service_orders;
DROP POLICY IF EXISTS "Managers can manage service orders in their branch" ON public.service_orders;

CREATE POLICY "Superadmin can manage all service orders"
ON public.service_orders
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view service orders in their branch"
ON public.service_orders
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Managers can manage service orders in their branch"
ON public.service_orders
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'field_user') OR public.has_role(auth.uid(), 'technician'))
  AND public.can_access_branch(auth.uid(), branch_id)
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- SUPPLIERS (recriar as políticas que foram dropadas)
-- =====================================================

DROP POLICY IF EXISTS "Superadmin can manage all suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view suppliers in their branch" ON public.suppliers;
DROP POLICY IF EXISTS "Users with permission can manage suppliers in their branch" ON public.suppliers;

CREATE POLICY "Superadmin can manage all suppliers"
ON public.suppliers
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view suppliers in their branch"
ON public.suppliers
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users with permission can manage suppliers in their branch"
ON public.suppliers
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
        AND up.tenant_id = suppliers.tenant_id
        AND up.page_suppliers = true
    )
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- INVOICES (recriar as políticas que foram dropadas)
-- =====================================================

DROP POLICY IF EXISTS "Superadmin can manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view invoices in their branch" ON public.invoices;
DROP POLICY IF EXISTS "Managers can manage invoices in their branch" ON public.invoices;

CREATE POLICY "Superadmin can manage all invoices"
ON public.invoices
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view invoices in their branch"
ON public.invoices
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Managers can manage invoices in their branch"
ON public.invoices
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
