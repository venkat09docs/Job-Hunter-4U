-- Add image column to clp_courses table
ALTER TABLE public.clp_courses 
ADD COLUMN image TEXT;

-- Update the clp_courses table to include image field with proper indexing
CREATE INDEX IF NOT EXISTS idx_clp_courses_image ON public.clp_courses(image) WHERE image IS NOT NULL;