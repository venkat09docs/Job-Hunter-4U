-- Test the RLS policy by creating a test function that simulates what institute admins should see
-- This will help us understand if the policies are working correctly

-- Create a test function to check what each institute admin should see
CREATE OR REPLACE FUNCTION test_institute_admin_assignments(admin_user_id uuid)
RETURNS TABLE(
  assignment_id uuid,
  assignment_user_id uuid,
  student_email text,
  institute_name text,
  assignment_type text
) AS $$
BEGIN
  -- Test career assignments
  RETURN QUERY
  SELECT 
    cta.id,
    cta.user_id,
    au.email,
    i.name,
    'career'::text
  FROM career_task_assignments cta
  JOIN auth.users au ON cta.user_id = au.id
  JOIN user_assignments ua ON cta.user_id = ua.user_id AND ua.is_active = true
  JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id AND iaa.is_active = true
  JOIN institutes i ON ua.institute_id = i.id
  WHERE cta.status IN ('submitted', 'verified')
    AND iaa.user_id = admin_user_id;
    
  -- Test job hunting assignments
  RETURN QUERY
  SELECT 
    jha.id,
    jha.user_id,
    au.email,
    i.name,
    'job_hunting'::text
  FROM job_hunting_assignments jha
  JOIN auth.users au ON jha.user_id = au.id
  JOIN user_assignments ua ON jha.user_id = ua.user_id AND ua.is_active = true
  JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id AND iaa.is_active = true
  JOIN institutes i ON ua.institute_id = i.id
  WHERE jha.status IN ('submitted', 'verified')
    AND iaa.user_id = admin_user_id;
    
  -- Test LinkedIn assignments
  RETURN QUERY
  SELECT 
    lut.id,
    lut.user_id,
    au.email,
    i.name,
    'linkedin'::text
  FROM linkedin_user_tasks lut
  JOIN auth.users au ON lut.user_id = au.id
  JOIN user_assignments ua ON lut.user_id = ua.user_id AND ua.is_active = true
  JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id AND iaa.is_active = true
  JOIN institutes i ON ua.institute_id = i.id
  WHERE lut.status IN ('SUBMITTED', 'VERIFIED')
    AND iaa.user_id = admin_user_id;
    
  -- Test GitHub assignments
  RETURN QUERY
  SELECT 
    gut.id,
    gut.user_id,
    au.email,
    i.name,
    'github'::text
  FROM github_user_tasks gut
  JOIN auth.users au ON gut.user_id = au.id
  JOIN user_assignments ua ON gut.user_id = ua.user_id AND ua.is_active = true
  JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id AND iaa.is_active = true
  JOIN institutes i ON ua.institute_id = i.id
  WHERE gut.status IN ('SUBMITTED', 'VERIFIED')
    AND iaa.user_id = admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;