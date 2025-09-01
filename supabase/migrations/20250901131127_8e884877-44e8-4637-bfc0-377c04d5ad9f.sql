-- Fix LinkedIn tasks RLS policies - use direct user_id reference
DROP POLICY IF EXISTS "Institute admins can view their institute linkedin tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can update their institute linkedin tasks" ON linkedin_user_tasks;

CREATE POLICY "Institute admins can view their institute linkedin tasks" ON linkedin_user_tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Institute admins can update their institute linkedin tasks" ON linkedin_user_tasks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);