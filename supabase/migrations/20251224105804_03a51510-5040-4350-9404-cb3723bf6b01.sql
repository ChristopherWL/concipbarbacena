-- Create RPC function to get stock category stats
CREATE OR REPLACE FUNCTION public.get_stock_category_stats(p_tenant_id UUID, p_branch_id UUID DEFAULT NULL)
RETURNS TABLE (
  category TEXT,
  total_items BIGINT,
  total_stock BIGINT,
  total_value NUMERIC,
  low_stock_count BIGINT,
  zero_stock_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category::TEXT,
    COUNT(*)::BIGINT as total_items,
    COALESCE(SUM(p.quantity), 0)::BIGINT as total_stock,
    COALESCE(SUM(p.quantity * COALESCE(p.price, 0)), 0)::NUMERIC as total_value,
    COUNT(*) FILTER (WHERE p.quantity <= COALESCE(p.min_quantity, 0) AND p.quantity > 0)::BIGINT as low_stock_count,
    COUNT(*) FILTER (WHERE p.quantity = 0)::BIGINT as zero_stock_count
  FROM public.products p
  WHERE p.tenant_id = p_tenant_id
    AND (p_branch_id IS NULL OR p.branch_id = p_branch_id)
  GROUP BY p.category;
END;
$$;

-- Create RPC function to get zero stock products (minimal data for alerts)
CREATE OR REPLACE FUNCTION public.get_zero_stock_products(p_tenant_id UUID, p_branch_id UUID DEFAULT NULL, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  sku TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.category::TEXT,
    p.sku
  FROM public.products p
  WHERE p.tenant_id = p_tenant_id
    AND (p_branch_id IS NULL OR p.branch_id = p_branch_id)
    AND p.quantity = 0
  ORDER BY p.updated_at DESC
  LIMIT p_limit;
END;
$$;

-- Create RPC function to get movement trends by category (last 7 days)
CREATE OR REPLACE FUNCTION public.get_movement_trends(p_tenant_id UUID, p_branch_id UUID DEFAULT NULL)
RETURNS TABLE (
  category TEXT,
  movement_date DATE,
  total_in BIGINT,
  total_out BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category::TEXT,
    sm.created_at::DATE as movement_date,
    COALESCE(SUM(CASE WHEN sm.movement_type = 'entrada' THEN sm.quantity ELSE 0 END), 0)::BIGINT as total_in,
    COALESCE(SUM(CASE WHEN sm.movement_type = 'saida' THEN sm.quantity ELSE 0 END), 0)::BIGINT as total_out
  FROM public.stock_movements sm
  JOIN public.products p ON p.id = sm.product_id
  WHERE sm.tenant_id = p_tenant_id
    AND (p_branch_id IS NULL OR sm.branch_id = p_branch_id)
    AND sm.created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY p.category, sm.created_at::DATE
  ORDER BY p.category, movement_date;
END;
$$;