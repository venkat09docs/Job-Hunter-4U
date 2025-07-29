-- Assign test user as Super admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('2eb353a2-f3fd-4c88-b17f-6569e76d6154', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;