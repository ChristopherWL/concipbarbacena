
-- Add permission-based policy for maintenances
CREATE POLICY "Users with fleet permission can manage maintenances"
ON public.maintenances
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = maintenances.tenant_id
        AND COALESCE(up.page_fleet, false) = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_permissions up
      JOIN public.permission_templates pt ON pt.id = up.template_id
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = maintenances.tenant_id
        AND COALESCE(pt.page_fleet, false) = true
        AND COALESCE(pt.is_active, true) = true
    )
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = maintenances.tenant_id
        AND COALESCE(up.page_fleet, false) = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_permissions up
      JOIN public.permission_templates pt ON pt.id = up.template_id
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = maintenances.tenant_id
        AND COALESCE(pt.page_fleet, false) = true
        AND COALESCE(pt.is_active, true) = true
    )
  )
);

-- Add permission-based policy for fuel_logs
CREATE POLICY "Users with fleet permission can manage fuel logs"
ON public.fuel_logs
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = fuel_logs.tenant_id
        AND COALESCE(up.page_fleet, false) = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_permissions up
      JOIN public.permission_templates pt ON pt.id = up.template_id
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = fuel_logs.tenant_id
        AND COALESCE(pt.page_fleet, false) = true
        AND COALESCE(pt.is_active, true) = true
    )
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = fuel_logs.tenant_id
        AND COALESCE(up.page_fleet, false) = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_permissions up
      JOIN public.permission_templates pt ON pt.id = up.template_id
      WHERE up.user_id = auth.uid()
        AND up.tenant_id = fuel_logs.tenant_id
        AND COALESCE(pt.page_fleet, false) = true
        AND COALESCE(pt.is_active, true) = true
    )
  )
);
