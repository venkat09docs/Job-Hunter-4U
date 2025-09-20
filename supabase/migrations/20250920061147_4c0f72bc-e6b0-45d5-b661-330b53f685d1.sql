-- Manually insert admin role for test@gmail.com using direct user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('2eb353a2-f3fd-4c88-b17f-6569e76d6154', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure user role exists
INSERT INTO public.user_roles (user_id, role) 
VALUES ('2eb353a2-f3fd-4c88-b17f-6569e76d6154', 'user'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;