-- Add category column to suppliers table
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'geral';

-- Create index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(category);