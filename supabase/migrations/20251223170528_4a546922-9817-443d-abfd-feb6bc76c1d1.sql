-- Add image_url column to obras table
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS image_url TEXT;