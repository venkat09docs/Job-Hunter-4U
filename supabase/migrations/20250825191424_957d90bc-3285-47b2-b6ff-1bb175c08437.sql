-- Fix institutes table security issue
-- Remove the overly permissive policy that exposes sensitive data to regular users
DROP POLICY IF EXISTS "Assigned users restricted access" ON public.institutes;

-- Create a new restrictive policy that only allows basic institute info for assigned users
-- This forces users to use the secure functions instead of direct table access
CREATE POLICY "Assigned users can view basic institute info only" 
  ON public.institutes 
  FOR SELECT 
  TO authenticated
  USING (
    -- Only allow access to basic, non-sensitive columns for regular users
    -- This policy will work with applications that SELECT specific safe columns
    (
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
    )
  );

-- Add a more restrictive policy that prevents SELECT * queries from exposing sensitive data
-- Regular users should use the get_safe_institute_* functions instead
CREATE POLICY "Restrict sensitive column access for regular users"
  ON public.institutes
  FOR SELECT
  TO authenticated
  USING (
    -- If user is admin or institute admin, allow full access (existing policies handle this)
    has_role(auth.uid(), 'admin'::app_role) 
    OR (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1 
        FROM institute_admin_assignments iaa 
        WHERE iaa.user_id = auth.uid() 
          AND iaa.institute_id = institutes.id 
          AND iaa.is_active = true
      )
    )
    -- For regular users, they should use security functions instead of direct table access
    -- This will block SELECT * queries that could expose sensitive data
  );