-- Add etapa_id column to diario_obras to link daily records to specific stages
ALTER TABLE public.diario_obras 
ADD COLUMN etapa_id uuid REFERENCES public.obra_etapas(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_diario_obras_etapa_id ON public.diario_obras(etapa_id);

-- Comment for documentation
COMMENT ON COLUMN public.diario_obras.etapa_id IS 'Links the daily record to a specific construction stage';