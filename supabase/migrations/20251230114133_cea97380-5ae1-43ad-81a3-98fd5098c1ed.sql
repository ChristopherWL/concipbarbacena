-- Add discount_value to fechamentos_mensais for supplier discounts
ALTER TABLE public.fechamentos_mensais
ADD COLUMN discount_value numeric DEFAULT 0;