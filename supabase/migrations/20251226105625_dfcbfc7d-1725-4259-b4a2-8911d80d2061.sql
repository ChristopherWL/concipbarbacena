
-- =====================================================
-- PROFESSIONAL BRANCH ISOLATION - PART 5
-- CUSTOMERS, FISCAL_COUPONS, FISCAL_NOTES, NOTIFICATIONS
-- =====================================================

-- =====================================================
-- CUSTOMERS
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Managers can view customers in their tenant" ON public.customers;
DROP POLICY IF EXISTS "Superadmin can manage all customers" ON public.customers;
DROP POLICY IF EXISTS "Superadmin can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Users with customer permission can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Users with customer permission can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Users with customer permission can update customers" ON public.customers;
DROP POLICY IF EXISTS "Users with customer permission can view customers" ON public.customers;

CREATE POLICY "Superadmin can manage all customers"
ON public.customers
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view customers in their branch"
ON public.customers
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users with permission can manage customers in their branch"
ON public.customers
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR EXISTS (
      SELECT 1 FROM public.user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = customers.tenant_id
        AND up.page_customers = true
    )
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- FISCAL_COUPONS
-- =====================================================

DROP POLICY IF EXISTS "Users can create fiscal coupons in their tenant" ON public.fiscal_coupons;
DROP POLICY IF EXISTS "Users can delete fiscal coupons in their tenant" ON public.fiscal_coupons;
DROP POLICY IF EXISTS "Users can update fiscal coupons in their tenant" ON public.fiscal_coupons;
DROP POLICY IF EXISTS "Users can view fiscal coupons in their tenant" ON public.fiscal_coupons;

CREATE POLICY "Superadmin can manage all fiscal coupons"
ON public.fiscal_coupons
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view fiscal coupons in their branch"
ON public.fiscal_coupons
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users can manage fiscal coupons in their branch"
ON public.fiscal_coupons
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
-- FISCAL_NOTES
-- =====================================================

DROP POLICY IF EXISTS "Users can create fiscal notes in their tenant" ON public.fiscal_notes;
DROP POLICY IF EXISTS "Users can delete fiscal notes in their tenant" ON public.fiscal_notes;
DROP POLICY IF EXISTS "Users can update fiscal notes in their tenant" ON public.fiscal_notes;
DROP POLICY IF EXISTS "Users can view fiscal notes from their tenant" ON public.fiscal_notes;

CREATE POLICY "Superadmin can manage all fiscal notes"
ON public.fiscal_notes
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view fiscal notes in their branch"
ON public.fiscal_notes
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

CREATE POLICY "Users can manage fiscal notes in their branch"
ON public.fiscal_notes
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.is_tenant_admin(auth.uid(), tenant_id)
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_branch(auth.uid(), branch_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view notifications in their tenant" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage notifications" ON public.notifications;

CREATE POLICY "Superadmin can manage all notifications"
ON public.notifications
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view notifications in their branch"
ON public.notifications
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    -- Notificação específica para o usuário
    user_id = auth.uid()
    OR
    -- Notificação da filial do usuário
    public.can_access_branch(auth.uid(), branch_id)
  )
);

CREATE POLICY "Users can manage their own notifications"
ON public.notifications
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
);
