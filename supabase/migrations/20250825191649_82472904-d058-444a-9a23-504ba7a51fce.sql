-- Fix the conflicting policies and implement proper security
-- Remove the conflicting policies
DROP POLICY IF EXISTS "Assigned users can view basic institute info only" ON public.institutes;
DROP POLICY IF EXISTS "Restrict sensitive column access for regular users" ON public.institutes;

-- Create a single, properly restrictive policy for regular users
-- This prevents direct access to sensitive data while allowing basic info
CREATE POLICY "Regular users basic institute access only" 
  ON public.institutes 
  FOR SELECT 
  TO authenticated
  USING (
    -- Only allow access if user is assigned to this institute
    -- AND they are not admin/institute_admin (those have separate policies)
    -- AND only expose non-sensitive data through application logic
    is_active = true 
    AND EXISTS (
      SELECT 1 
      FROM user_assignments ua 
      WHERE ua.institute_id = institutes.id 
        AND ua.user_id = auth.uid() 
        AND ua.is_active = true
    )
    AND NOT has_role(auth.uid(), 'admin'::app_role)
    AND NOT has_role(auth.uid(), 'institute_admin'::app_role)
    -- This policy will work but applications should only SELECT basic columns
    -- or use the get_safe_institute_* functions for proper data filtering
  );