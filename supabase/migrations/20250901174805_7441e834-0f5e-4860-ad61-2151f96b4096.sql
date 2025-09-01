-- Fix the core issue: The user is an institute_admin, not a recruiter
-- But institute admins are seeing assignments from OTHER institutes they don't manage
-- The RLS policy needs to be fixed to ensure institute admins only see users from their assigned institutes

-- Let's check what's happening by updating the RLS policies to be more restrictive
-- First, let's see all the current policies and fix the security hole

-- Fix: Update the institute admin policy to be more strict about institute matching
DROP POLICY IF EXISTS "Institute admins can manage their institute user assignments" ON career_task_assignments;

CREATE POLICY "Institute admins can manage their institute user assignments" 
ON career_task_assignments 
FOR ALL 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = career_task_assignments.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = career_task_assignments.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);