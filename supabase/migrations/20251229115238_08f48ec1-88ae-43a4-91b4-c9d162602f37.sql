-- Ajusta lógica de permissão de exclusão: admin de filial (RH + edição) pode excluir colaboradores

CREATE OR REPLACE FUNCTION public.can_user_delete(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (can_delete = true)
          OR (page_hr = true AND can_edit = true)
      FROM public.user_permissions
      WHERE user_id = p_user_id
      LIMIT 1
    ),
    false
  )
$$;
