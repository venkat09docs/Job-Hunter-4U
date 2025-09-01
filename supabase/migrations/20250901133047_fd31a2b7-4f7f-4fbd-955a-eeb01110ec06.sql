-- Add RLS policy for institute admins to view their students' GitHub tasks
CREATE POLICY "Institute admins can view their students GitHub tasks" 
ON public.github_user_tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- Also add UPDATE policy for institute admins to verify GitHub tasks
CREATE POLICY "Institute admins can update their students GitHub tasks for verification" 
ON public.github_user_tasks 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);