-- Test the RLS policy by checking what the recruiter can see
-- First, let's check the current RLS policies on career_task_assignments
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'career_task_assignments';