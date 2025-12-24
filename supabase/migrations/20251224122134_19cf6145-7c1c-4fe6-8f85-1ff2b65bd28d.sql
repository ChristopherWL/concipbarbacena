-- =====================================================
-- PARTE 1: Estrutura de Dados (Colunas e Índices)
-- =====================================================

-- 1. Adicionar novos valores ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'branch_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_leader';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'field_user';

-- 2. Adicionar coluna team_id em profiles (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Criar índices para otimização de consultas hierárquicas
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_branch_id ON public.teams(branch_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON public.teams(leader_id);

-- 4. Comentários para documentação
COMMENT ON COLUMN public.profiles.branch_id IS 'Filial principal do usuário (NULL para super_admin)';
COMMENT ON COLUMN public.profiles.team_id IS 'Equipe do usuário (NULL se não pertencer a uma equipe)';