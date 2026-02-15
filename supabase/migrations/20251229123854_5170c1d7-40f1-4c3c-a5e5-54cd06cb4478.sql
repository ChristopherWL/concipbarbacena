-- Alter service_order_id column to allow NULL values
ALTER TABLE public.service_provider_assignments 
ALTER COLUMN service_order_id DROP NOT NULL;