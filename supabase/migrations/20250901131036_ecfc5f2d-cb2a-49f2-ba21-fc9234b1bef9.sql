-- Fix LinkedIn tasks RLS policies with correct column names
DROP POLICY IF EXISTS "Institute admins can view their institute linkedin tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can update their institute linkedin tasks" ON linkedin_user_tasks;

CREATE POLICY "Institute admins can view their institute linkedin tasks" ON linkedin_user_tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM linkedin_users lu
    JOIN user_assignments ua ON lu.auth_uid = ua.user_id
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE lu.id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Institute admins can update their institute linkedin tasks" ON linkedin_user_tasks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM linkedin_users lu
    JOIN user_assignments ua ON lu.auth_uid = ua.user_id
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE lu.id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);