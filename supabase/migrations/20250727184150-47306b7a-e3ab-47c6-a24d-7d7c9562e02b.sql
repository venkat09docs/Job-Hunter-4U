-- Add image_url field to ai_tools table
ALTER TABLE public.ai_tools 
ADD COLUMN image_url TEXT;