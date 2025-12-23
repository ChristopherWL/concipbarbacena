-- Create service_order_etapas table for tracking stages in service orders
CREATE TABLE public.service_order_etapas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  percentual_peso NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  data_inicio_real DATE,
  data_fim_real DATE,
  responsavel_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create diario_service_orders table for daily logs on service orders
CREATE TABLE public.diario_service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  etapa_id UUID REFERENCES public.service_order_etapas(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  registrado_por TEXT,
  atividades_realizadas TEXT,
  materiais_utilizados TEXT,
  ocorrencias TEXT,
  fotos JSONB,
  supervisor_signature TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  validated_at TIMESTAMPTZ,
  validated_by TEXT,
  observacao_fiscalizacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add progresso column to service_orders if not exists
ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS progresso INTEGER NOT NULL DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.service_order_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_service_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_order_etapas
CREATE POLICY "Users can view etapas from their tenant"
  ON public.service_order_etapas FOR SELECT
  USING (public.user_belongs_to_tenant(auth.uid(), tenant_id));

CREATE POLICY "Users can insert etapas in their tenant"
  ON public.service_order_etapas FOR INSERT
  WITH CHECK (public.user_belongs_to_tenant(auth.uid(), tenant_id));

CREATE POLICY "Users can update etapas in their tenant"
  ON public.service_order_etapas FOR UPDATE
  USING (public.user_belongs_to_tenant(auth.uid(), tenant_id));

CREATE POLICY "Users can delete etapas in their tenant"
  ON public.service_order_etapas FOR DELETE
  USING (public.user_belongs_to_tenant(auth.uid(), tenant_id));

-- Create RLS policies for diario_service_orders
CREATE POLICY "Users can view diario from their tenant"
  ON public.diario_service_orders FOR SELECT
  USING (public.user_belongs_to_tenant(auth.uid(), tenant_id));

CREATE POLICY "Users can insert diario in their tenant"
  ON public.diario_service_orders FOR INSERT
  WITH CHECK (public.user_belongs_to_tenant(auth.uid(), tenant_id));

CREATE POLICY "Users can update diario in their tenant"
  ON public.diario_service_orders FOR UPDATE
  USING (public.user_belongs_to_tenant(auth.uid(), tenant_id));

CREATE POLICY "Users can delete diario in their tenant"
  ON public.diario_service_orders FOR DELETE
  USING (public.user_belongs_to_tenant(auth.uid(), tenant_id));

-- Create indexes for better performance
CREATE INDEX idx_service_order_etapas_service_order_id ON public.service_order_etapas(service_order_id);
CREATE INDEX idx_service_order_etapas_tenant_id ON public.service_order_etapas(tenant_id);
CREATE INDEX idx_diario_service_orders_service_order_id ON public.diario_service_orders(service_order_id);
CREATE INDEX idx_diario_service_orders_tenant_id ON public.diario_service_orders(tenant_id);
CREATE INDEX idx_diario_service_orders_data ON public.diario_service_orders(data);

-- Create triggers for updated_at
CREATE TRIGGER update_service_order_etapas_updated_at
  BEFORE UPDATE ON public.service_order_etapas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diario_service_orders_updated_at
  BEFORE UPDATE ON public.diario_service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();