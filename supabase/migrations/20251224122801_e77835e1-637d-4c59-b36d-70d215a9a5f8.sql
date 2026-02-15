-- Adiciona novos valores ao enum app_role
DO $$
BEGIN
  -- branch_manager
  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'branch_manager';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- team_leader
  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_leader';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- field_user
  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'field_user';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- director
  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;