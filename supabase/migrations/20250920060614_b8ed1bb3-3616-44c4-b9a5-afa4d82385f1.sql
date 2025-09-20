-- Ensure test@gmail.com has admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'test@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure test@gmail.com has user role  
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users 
WHERE email = 'test@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify both users have admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'venkat09docs@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;