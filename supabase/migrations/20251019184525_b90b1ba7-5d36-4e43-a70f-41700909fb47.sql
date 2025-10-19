-- Update RLS policy for clp_courses to respect is_published for regular users
-- Drop the old policy
DROP POLICY IF EXISTS "Users can view active courses" ON public.clp_courses;

-- Create new policy that checks both is_active and is_published for regular users
-- Admins, recruiters, and institute_admins can see all courses (including drafts)
CREATE POLICY "Users can view published courses" 
ON public.clp_courses
FOR SELECT
USING (
  is_active = true AND (
    -- Regular users can only see published courses
    is_published = true 
    OR 
    -- Admins, recruiters, and institute admins can see all courses (including drafts)
    has_role(auth.uid(), 'admin'::app_role) 
    OR 
    has_role(auth.uid(), 'recruiter'::app_role) 
    OR 
    has_role(auth.uid(), 'institute_admin'::app_role)
  )
);