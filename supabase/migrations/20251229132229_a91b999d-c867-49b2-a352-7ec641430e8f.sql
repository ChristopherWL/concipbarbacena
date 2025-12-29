-- Add due_day and payment_day columns for monthly payment type
ALTER TABLE public.service_providers
ADD COLUMN monthly_due_day integer CHECK (monthly_due_day >= 1 AND monthly_due_day <= 31),
ADD COLUMN monthly_payment_day integer CHECK (monthly_payment_day >= 1 AND monthly_payment_day <= 31);