-- First, let's check if these users exist and get their user_ids
-- Then insert admin roles for the specified email addresses

-- Insert admin role for test@gmail.com user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'test@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert admin role for venkat09docs@gmail.com user  
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'venkat09docs@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;