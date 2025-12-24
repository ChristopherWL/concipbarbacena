-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_branch_id ON public.products(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON public.products(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_products_tenant_branch ON public.products(tenant_id, branch_id);

-- Indexes for stock_audits table
CREATE INDEX IF NOT EXISTS idx_stock_audits_status ON public.stock_audits(status);
CREATE INDEX IF NOT EXISTS idx_stock_audits_product_id ON public.stock_audits(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_audits_parent_audit_id ON public.stock_audits(parent_audit_id);
CREATE INDEX IF NOT EXISTS idx_stock_audits_tenant_id ON public.stock_audits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_audits_audit_type ON public.stock_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_stock_audits_tenant_parent ON public.stock_audits(tenant_id, parent_audit_id);
CREATE INDEX IF NOT EXISTS idx_stock_audits_reported_at ON public.stock_audits(reported_at DESC);

-- Indexes for stock_movements table
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON public.stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_product ON public.stock_movements(tenant_id, product_id);