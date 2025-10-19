-- Add is_published field to clp_courses table
ALTER TABLE public.clp_courses 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN public.clp_courses.is_published IS 'Controls whether the course is visible to students. Draft courses are only visible to admins/recruiters.';

-- Update existing courses to be published by default (for backward compatibility)
UPDATE public.clp_courses 
SET is_published = true 
WHERE is_active = true;