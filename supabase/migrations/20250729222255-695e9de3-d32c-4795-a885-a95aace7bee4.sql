-- Allow institute admins to update profiles of users in their institutes
CREATE POLICY "Institute admins can update profiles of their institute users" 
ON public.profiles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  EXISTS (
    SELECT 1 
    FROM user_assignments ua
    INNER JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = profiles.user_id 
      AND iaa.user_id = auth.uid() 
      AND ua.is_active = true 
      AND iaa.is_active = true
  )
);