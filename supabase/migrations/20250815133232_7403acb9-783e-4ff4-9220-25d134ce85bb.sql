-- Update RLS policies for linkedin_progress to allow institute admins to view their students' data
DROP POLICY IF EXISTS "Users can view their own LinkedIn progress" ON public.linkedin_progress;

CREATE POLICY "Users can view their own LinkedIn progress" 
ON public.linkedin_progress 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  (
    has_role(auth.uid(), 'institute_admin'::app_role) 
    AND EXISTS (
      SELECT 1 
      FROM user_assignments ua
      JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
      WHERE ua.user_id = linkedin_progress.user_id 
        AND iaa.user_id = auth.uid() 
        AND ua.is_active = true 
        AND iaa.is_active = true
    )
  )
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update RLS policies for github_progress to allow institute admins to view their students' data  
DROP POLICY IF EXISTS "Users can view their own GitHub progress" ON public.github_progress;

CREATE POLICY "Users can view their own GitHub progress" 
ON public.github_progress 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  (
    has_role(auth.uid(), 'institute_admin'::app_role) 
    AND EXISTS (
      SELECT 1 
      FROM user_assignments ua
      JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
      WHERE ua.user_id = github_progress.user_id 
        AND iaa.user_id = auth.uid() 
        AND ua.is_active = true 
        AND iaa.is_active = true
    )
  )
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);