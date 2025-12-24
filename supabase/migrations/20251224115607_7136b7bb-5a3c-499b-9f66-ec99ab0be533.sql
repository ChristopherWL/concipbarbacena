-- Drop the restrictive INSERT policy and create a more appropriate one
DROP POLICY IF EXISTS "Authenticated users can insert stock audits" ON public.stock_audits;

-- Create new INSERT policy that allows authenticated users to insert audits for their tenant
CREATE POLICY "Authenticated users can insert stock audits" 
ON public.stock_audits 
FOR INSERT 
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- Add UPDATE policy to allow users to update audits they have access to
DROP POLICY IF EXISTS "Users can update stock audits" ON public.stock_audits;
CREATE POLICY "Users can update stock audits" 
ON public.stock_audits 
FOR UPDATE 
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) 
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) 
    OR public.has_role(auth.uid(), 'manager'::public.app_role) 
    OR public.is_superadmin(auth.uid()) 
    OR reported_by = auth.uid()
  )
);

-- Add DELETE policy for admins
DROP POLICY IF EXISTS "Admins can delete stock audits" ON public.stock_audits;
CREATE POLICY "Admins can delete stock audits" 
ON public.stock_audits 
FOR DELETE 
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) 
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) 
    OR public.is_superadmin(auth.uid())
  )
);