-- Tabela para pagamentos manuais de prestadores (não vinculados a OS)
CREATE TABLE IF NOT EXISTS public.service_provider_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'diaria',
  days_worked INTEGER DEFAULT 0,
  hours_worked NUMERIC(10,2) DEFAULT 0,
  rate_applied NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_provider_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view payments from their tenant"
ON public.service_provider_payments
FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can insert payments for their tenant"
ON public.service_provider_payments
FOR INSERT
WITH CHECK (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update payments for their tenant"
ON public.service_provider_payments
FOR UPDATE
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can delete payments for their tenant"
ON public.service_provider_payments
FOR DELETE
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_service_provider_payments_updated_at
BEFORE UPDATE ON public.service_provider_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();