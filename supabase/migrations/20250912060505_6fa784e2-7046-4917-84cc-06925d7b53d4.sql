-- Add category field to clp_courses table
ALTER TABLE public.clp_courses 
ADD COLUMN category TEXT DEFAULT 'General';

-- Create index for better performance when filtering by category
CREATE INDEX idx_clp_courses_category ON public.clp_courses(category);

-- Update existing courses to have a default category
UPDATE public.clp_courses 
SET category = 'AI & Machine Learning' 
WHERE category IS NULL;