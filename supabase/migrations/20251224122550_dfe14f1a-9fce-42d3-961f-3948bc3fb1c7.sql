-- Part 1 (isolated): add new roles to enum only. Must run alone in its own migration.
DO $$
BEGIN
  -- Add new enum values safely (ignore if already exists)
  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'branch_manager';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_leader';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'field_user';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;