-- Fix the security definer view issue by creating a proper view without security definer
DROP VIEW IF EXISTS public.institute_directory;

-- Create a simple view without security definer that exposes only safe data
CREATE VIEW public.institute_directory AS
SELECT 
  id,
  name,
  description,
  code,
  is_active
FROM public.institutes
WHERE is_active = true;

-- Enable RLS on the view (this is the safer approach)
ALTER VIEW public.institute_directory SET (security_invoker = true);

-- Create RLS policy for the view that allows public access to safe data only
-- Note: Since this is a view, we'll handle access through the underlying table policies