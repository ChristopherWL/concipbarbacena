-- Add 'resolucao' to audit_type enum
ALTER TYPE stock_audit_type ADD VALUE IF NOT EXISTS 'resolucao';

-- Add parent_audit_id to reference original audit
ALTER TABLE public.stock_audits 
ADD COLUMN IF NOT EXISTS parent_audit_id UUID REFERENCES public.stock_audits(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_audits_parent ON public.stock_audits(parent_audit_id) WHERE parent_audit_id IS NOT NULL;