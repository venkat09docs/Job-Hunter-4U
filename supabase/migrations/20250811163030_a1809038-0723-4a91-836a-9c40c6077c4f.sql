-- Fix institutes table RLS policies to prevent unauthorized access to sensitive business data
-- Drop the overly permissive policy that allows public access to sensitive institute data
DROP POLICY IF EXISTS "Users can view active institutes" ON public.institutes;

-- Create a more secure policy for viewing institutes
-- Only allow authenticated users who are assigned to institutes to view basic institute info
CREATE POLICY "Assigned users can view basic institute info" 
ON public.institutes 
FOR SELECT 
TO authenticated 
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.institute_id = institutes.id 
    AND ua.user_id = auth.uid() 
    AND ua.is_active = true
  )
);

-- Create a policy for institute admins to view full details of their institutes
CREATE POLICY "Institute admins can view their institute details" 
ON public.institutes 
FOR SELECT 
TO authenticated 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  EXISTS (
    SELECT 1
    FROM public.institute_admin_assignments iaa
    WHERE iaa.user_id = auth.uid() 
    AND iaa.institute_id = institutes.id 
    AND iaa.is_active = true
  )
);

-- Create a view for public institute listings that only exposes safe, non-sensitive data
CREATE OR REPLACE VIEW public.institute_directory AS
SELECT 
  id,
  name,
  description,
  code,
  is_active
FROM public.institutes
WHERE is_active = true;

-- Allow public read access to the safe view only
GRANT SELECT ON public.institute_directory TO public;