
-- Recriar função can_user_delete que foi criada parcialmente
CREATE OR REPLACE FUNCTION public.can_user_delete(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT can_delete FROM user_permissions WHERE user_id = p_user_id LIMIT 1),
    false
  )
$$;

-- Atualizar política de DELETE para service_providers
DROP POLICY IF EXISTS "service_providers_delete" ON service_providers;
CREATE POLICY "service_providers_delete" ON service_providers
FOR DELETE USING (
  is_superadmin(auth.uid()) OR 
  (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role)) OR
  (tenant_id = get_user_tenant_id(auth.uid()) AND can_user_delete(auth.uid()) AND can_access_branch(auth.uid(), branch_id))
);
