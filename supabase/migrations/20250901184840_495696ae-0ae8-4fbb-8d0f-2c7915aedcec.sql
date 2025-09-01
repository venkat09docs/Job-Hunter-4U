-- Fix the search path issue for the test function
ALTER FUNCTION test_institute_admin_assignments(uuid) SET search_path = public;

-- Run tests for each institute admin to see what they should see
SELECT 'nit@g.com admin (RNSTech 1)' as admin_info, * FROM test_institute_admin_assignments('ce283788-7f85-4212-90b1-19563ad939cc'::uuid);

-- Also test direct RLS behavior with a simple query
SET role authenticated;
SET "request.jwt.claims" = '{"sub": "ce283788-7f85-4212-90b1-19563ad939cc"}';

-- This should show what institute admin nit@g.com sees when querying career assignments
SELECT 
  'Direct RLS Test' as test_type,
  cta.id, 
  cta.user_id,
  au.email as student_email,
  cta.status
FROM career_task_assignments cta
JOIN auth.users au ON cta.user_id = au.id  
WHERE cta.status = 'submitted'
LIMIT 5;