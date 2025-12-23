-- 1) Criar função para verificar permissão de editar notas fiscais
CREATE OR REPLACE FUNCTION public.can_edit_invoices(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_superadmin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.tenant_id = _tenant_id
        AND ur.role IN ('admin'::public.app_role, 'manager'::public.app_role, 'warehouse'::public.app_role)
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_permissions up
      WHERE up.user_id = _user_id
        AND up.tenant_id = _tenant_id
        AND COALESCE(up.page_invoices, false) = true
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_permissions up
      JOIN public.permission_templates pt ON pt.id = up.template_id
      WHERE up.user_id = _user_id
        AND up.tenant_id = _tenant_id
        AND COALESCE(pt.page_invoices, false) = true
        AND COALESCE(pt.is_active, true) = true
    )
$$;

-- 2) Criar policy para UPDATE na tabela invoices
CREATE POLICY "Invoices update by permission"
ON public.invoices
FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    created_by = auth.uid() OR public.can_edit_invoices(auth.uid(), tenant_id)
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
);