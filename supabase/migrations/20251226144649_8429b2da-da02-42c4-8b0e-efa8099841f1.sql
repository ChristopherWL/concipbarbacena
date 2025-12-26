-- Add a 'tipo' column to differentiate between construction diary entries and obra update reports
-- 'diario_campo' = Daily logs filled by field teams
-- 'atualizacao_obra' = Update reports created from the Obras page

ALTER TABLE public.diario_obras 
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'atualizacao_obra';

-- Update existing records: if they have equipe_assinaturas or were created from DiarioObras page, mark as 'diario_campo'
-- Records without these fields are likely obra updates
UPDATE public.diario_obras 
SET tipo = 'diario_campo' 
WHERE (equipe_assinaturas IS NOT NULL AND equipe_assinaturas::text != '[]')
   OR (equipe_manha IS NOT NULL)
   OR (equipe_tarde IS NOT NULL)
   OR (hora_inicio_manha IS NOT NULL)
   OR (hora_inicio_tarde IS NOT NULL);

-- Add an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_diario_obras_tipo ON public.diario_obras(tipo);