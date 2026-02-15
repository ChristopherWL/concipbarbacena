
-- =====================================================
-- PROFESSIONAL BRANCH ISOLATION - PART 7
-- HR-RELATED TABLES (via employee branch)
-- =====================================================

-- Função helper para verificar acesso a dados de funcionário
CREATE OR REPLACE FUNCTION public.can_access_employee(_user_id uuid, _employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_superadmin(_user_id)
    OR
    EXISTS (
      SELECT 1 
      FROM public.employees e
      WHERE e.id = _employee_id
        AND e.tenant_id = public.get_user_tenant_id(_user_id)
        AND public.can_access_branch(_user_id, e.branch_id)
    )
$$;

-- =====================================================
-- LEAVES (Afastamentos)
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage leaves" ON public.leaves;
DROP POLICY IF EXISTS "Superadmin can manage all leaves" ON public.leaves;
DROP POLICY IF EXISTS "Users can view leaves in their tenant" ON public.leaves;

CREATE POLICY "Superadmin can manage all leaves"
ON public.leaves
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view leaves in their branch"
ON public.leaves
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

CREATE POLICY "Managers can manage leaves in their branch"
ON public.leaves
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

-- =====================================================
-- VACATIONS (Férias)
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage vacations" ON public.vacations;
DROP POLICY IF EXISTS "Superadmin can manage all vacations" ON public.vacations;
DROP POLICY IF EXISTS "Users can view vacations in their tenant" ON public.vacations;

CREATE POLICY "Superadmin can manage all vacations"
ON public.vacations
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view vacations in their branch"
ON public.vacations
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

CREATE POLICY "Managers can manage vacations in their branch"
ON public.vacations
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

-- =====================================================
-- PAYROLLS (Folhas de Pagamento)
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage payrolls" ON public.payrolls;
DROP POLICY IF EXISTS "Superadmin can manage all payrolls" ON public.payrolls;
DROP POLICY IF EXISTS "Users can view payrolls in their tenant" ON public.payrolls;

CREATE POLICY "Superadmin can manage all payrolls"
ON public.payrolls
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view payrolls in their branch"
ON public.payrolls
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

CREATE POLICY "Managers can manage payrolls in their branch"
ON public.payrolls
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

-- =====================================================
-- EMPLOYEE_EPC_ASSIGNMENTS
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage EPC assignments" ON public.employee_epc_assignments;
DROP POLICY IF EXISTS "Superadmin can manage all EPC assignments" ON public.employee_epc_assignments;
DROP POLICY IF EXISTS "Users can view EPC assignments in their tenant" ON public.employee_epc_assignments;

CREATE POLICY "Superadmin can manage all EPC assignments"
ON public.employee_epc_assignments
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view EPC assignments in their branch"
ON public.employee_epc_assignments
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

CREATE POLICY "Managers can manage EPC assignments in their branch"
ON public.employee_epc_assignments
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'warehouse'))
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

-- =====================================================
-- EMPLOYEE_EPI_ASSIGNMENTS
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage EPI assignments" ON public.employee_epi_assignments;
DROP POLICY IF EXISTS "Superadmin can manage all EPI assignments" ON public.employee_epi_assignments;
DROP POLICY IF EXISTS "Users can view EPI assignments in their tenant" ON public.employee_epi_assignments;

CREATE POLICY "Superadmin can manage all EPI assignments"
ON public.employee_epi_assignments
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view EPI assignments in their branch"
ON public.employee_epi_assignments
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

CREATE POLICY "Managers can manage EPI assignments in their branch"
ON public.employee_epi_assignments
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'warehouse'))
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

-- =====================================================
-- EMPLOYEE_FERRAMENTAS_ASSIGNMENTS
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage Ferramentas assignments" ON public.employee_ferramentas_assignments;
DROP POLICY IF EXISTS "Superadmin can manage all Ferramentas assignments" ON public.employee_ferramentas_assignments;
DROP POLICY IF EXISTS "Users can view Ferramentas assignments in their tenant" ON public.employee_ferramentas_assignments;

CREATE POLICY "Superadmin can manage all Ferramentas assignments"
ON public.employee_ferramentas_assignments
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view Ferramentas assignments in their branch"
ON public.employee_ferramentas_assignments
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

CREATE POLICY "Managers can manage Ferramentas assignments in their branch"
ON public.employee_ferramentas_assignments
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'warehouse'))
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

-- =====================================================
-- EMPLOYEE_HISTORY
-- =====================================================

DROP POLICY IF EXISTS "Managers can manage employee history" ON public.employee_history;
DROP POLICY IF EXISTS "Superadmin can manage all employee history" ON public.employee_history;
DROP POLICY IF EXISTS "Users can view employee history in their tenant" ON public.employee_history;

CREATE POLICY "Superadmin can manage all employee_history"
ON public.employee_history
FOR ALL
TO public
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view employee_history in their branch"
ON public.employee_history
FOR SELECT
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);

CREATE POLICY "Managers can manage employee_history in their branch"
ON public.employee_history
FOR ALL
TO public
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.can_access_employee(auth.uid(), employee_id)
);
