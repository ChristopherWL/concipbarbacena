-- Additional indexes for improved query performance

-- Text search index for product description (name already has trgm index)
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON public.products USING gin(description gin_trgm_ops);

-- Composite index for common product searches (name + description combined search)
CREATE INDEX IF NOT EXISTS idx_products_name_description_trgm ON public.products USING gin((name || ' ' || COALESCE(description, '')) gin_trgm_ops);

-- Index for movement_type on stock_movements (for filtering by type)
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON public.stock_movements(movement_type);

-- Composite index for reports: tenant + movement_type + date
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_type_date ON public.stock_movements(tenant_id, movement_type, created_at DESC);

-- Composite index for branch-specific movement reports
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_type_date ON public.stock_movements(branch_id, movement_type, created_at DESC);