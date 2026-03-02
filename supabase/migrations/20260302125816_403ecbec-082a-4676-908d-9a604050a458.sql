
-- Drop the incorrect unique constraint that doesn't include supplier_id
ALTER TABLE public.fechamentos_mensais 
DROP CONSTRAINT fechamentos_mensais_tenant_id_reference_month_reference_yea_key;

-- Add the correct unique constraint including supplier_id
ALTER TABLE public.fechamentos_mensais 
ADD CONSTRAINT fechamentos_mensais_tenant_supplier_month_year_key 
UNIQUE (tenant_id, supplier_id, reference_month, reference_year);
