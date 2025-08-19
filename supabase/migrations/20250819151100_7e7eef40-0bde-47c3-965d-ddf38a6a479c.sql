-- Add RLS policy for institute admins to view profiles of their assigned students
CREATE POLICY "Institute admins can view assigned student profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Institute admins can view profiles of users assigned to their institutes
  (
    has_role(auth.uid(), 'institute_admin'::app_role) 
    AND EXISTS (
      SELECT 1
      FROM public.user_assignments ua
      JOIN public.institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
      WHERE ua.user_id = profiles.user_id 
      AND iaa.user_id = auth.uid() 
      AND ua.is_active = true 
      AND iaa.is_active = true
    )
  )
);