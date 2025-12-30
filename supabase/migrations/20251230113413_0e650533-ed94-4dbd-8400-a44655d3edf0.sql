-- Add supplier_id to fechamentos_mensais for individual supplier closing
ALTER TABLE public.fechamentos_mensais
ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- Create unique index to allow one closing per supplier per month per tenant
-- Note: supplier_id can be NULL for legacy global closings
CREATE UNIQUE INDEX fechamentos_mensais_tenant_supplier_month_year_unique 
ON public.fechamentos_mensais(tenant_id, supplier_id, reference_month, reference_year)
WHERE supplier_id IS NOT NULL;