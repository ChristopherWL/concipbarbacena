ALTER TABLE public.fechamentos_mensais ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'fechamentos_mensais'
      AND policyname = 'Users can update fechamentos_mensais of their tenant'
  ) THEN
    CREATE POLICY "Users can update fechamentos_mensais of their tenant"
      ON public.fechamentos_mensais
      FOR UPDATE
      USING ((tenant_id = public.get_user_tenant_id(auth.uid())) OR public.is_superadmin(auth.uid()))
      WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())) OR public.is_superadmin(auth.uid()));
  END IF;
END $$;