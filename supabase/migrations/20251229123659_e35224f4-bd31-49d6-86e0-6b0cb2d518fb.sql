-- Drop existing insert policy
DROP POLICY IF EXISTS sp_assignments_insert ON public.service_provider_assignments;

-- Create new insert policy that includes technician role
CREATE POLICY sp_assignments_insert ON public.service_provider_assignments
FOR INSERT WITH CHECK (
  is_superadmin(auth.uid()) OR 
  (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'manager'::app_role) OR 
      has_role(auth.uid(), 'technician'::app_role)
    )
  )
);

-- Also update the update policy to include technician
DROP POLICY IF EXISTS sp_assignments_update ON public.service_provider_assignments;

CREATE POLICY sp_assignments_update ON public.service_provider_assignments
FOR UPDATE USING (
  is_superadmin(auth.uid()) OR 
  (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'manager'::app_role) OR 
      has_role(auth.uid(), 'technician'::app_role)
    )
  )
);