-- Create function for updating updated_at column if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for obra stages/etapas
CREATE TABLE public.obra_etapas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'pausada')),
  percentual_peso INTEGER NOT NULL DEFAULT 0,
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  data_inicio_real DATE,
  data_fim_real DATE,
  responsavel_id UUID REFERENCES public.technicians(id),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.obra_etapas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view etapas from their tenant"
ON public.obra_etapas
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert etapas in their tenant"
ON public.obra_etapas
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update etapas in their tenant"
ON public.obra_etapas
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete etapas in their tenant"
ON public.obra_etapas
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_obra_etapas_obra_id ON public.obra_etapas(obra_id);
CREATE INDEX idx_obra_etapas_tenant_id ON public.obra_etapas(tenant_id);

-- Update trigger for updated_at
CREATE TRIGGER update_obra_etapas_updated_at
BEFORE UPDATE ON public.obra_etapas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();