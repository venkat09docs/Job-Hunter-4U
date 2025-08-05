-- Check if we have any recent users created and see if the trigger should have fired
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users 
WHERE created_at > '2025-08-05 00:34:00'
ORDER BY created_at DESC
LIMIT 5;

-- Also check if our profiles were created for recent users
SELECT p.user_id, p.email, p.full_name, p.created_at
FROM public.profiles p
WHERE p.created_at > '2025-08-05 00:34:00'
ORDER BY p.created_at DESC
LIMIT 5;