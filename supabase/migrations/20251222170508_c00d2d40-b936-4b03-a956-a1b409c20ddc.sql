-- Create fiscal_coupons table for monthly closing (separate from invoices)
CREATE TABLE public.fiscal_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  coupon_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiscal_coupons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the existing function
CREATE POLICY "Users can view fiscal coupons in their tenant"
ON public.fiscal_coupons
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create fiscal coupons in their tenant"
ON public.fiscal_coupons
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update fiscal coupons in their tenant"
ON public.fiscal_coupons
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete fiscal coupons in their tenant"
ON public.fiscal_coupons
FOR DELETE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Create index for performance
CREATE INDEX idx_fiscal_coupons_tenant_date ON public.fiscal_coupons(tenant_id, issue_date);
CREATE INDEX idx_fiscal_coupons_supplier ON public.fiscal_coupons(supplier_id);

-- Create trigger for updated_at
CREATE TRIGGER update_fiscal_coupons_updated_at
BEFORE UPDATE ON public.fiscal_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();