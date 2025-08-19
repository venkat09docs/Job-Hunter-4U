-- Create profile for the user who is missing it
INSERT INTO profiles (user_id, username, full_name, email, industry)
SELECT 
  au.id as user_id,
  COALESCE(au.raw_user_meta_data ->> 'username', split_part(au.email, '@', 1)) as username,
  COALESCE(au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1)) as full_name,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'industry', 'IT') as industry
FROM auth.users au
WHERE au.id = '1ab94a48-d392-49a6-9257-2840bad3923e'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = au.id);