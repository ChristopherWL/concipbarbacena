-- Drop existing policies on stock_audits
DROP POLICY IF EXISTS "Managers can manage stock audits" ON public.stock_audits;
DROP POLICY IF EXISTS "Superadmin can manage all stock audits" ON public.stock_audits;
DROP POLICY IF EXISTS "Users can view stock audits in their tenant" ON public.stock_audits;

-- Create new immutable audit policies

-- 1. INSERT: Authenticated users can create audits in their tenant
CREATE POLICY "Authenticated users can insert stock audits"
ON public.stock_audits
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND reported_by = auth.uid()
);

-- 2. SELECT: Regular users see only their own audits, admins/managers see all in tenant
CREATE POLICY "Users can view stock audits based on role"
ON public.stock_audits
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    -- Admins and managers can see all audits in their tenant
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
    OR public.is_superadmin(auth.uid())
    -- Regular users can only see their own audits
    OR reported_by = auth.uid()
  )
);

-- 3. UPDATE: BLOCKED for everyone - audits are immutable
-- No UPDATE policy means no one can update

-- 4. DELETE: BLOCKED for everyone - audits are immutable
-- No DELETE policy means no one can delete

-- Add a comment to document the immutability design decision
COMMENT ON TABLE public.stock_audits IS 'Stock audit records. IMMUTABLE by design - INSERT only, no UPDATE/DELETE allowed via RLS for audit integrity.';