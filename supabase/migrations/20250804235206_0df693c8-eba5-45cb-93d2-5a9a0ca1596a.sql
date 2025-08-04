-- Create missing profile and user role for existing user (without ON CONFLICT)
INSERT INTO public.profiles (user_id, full_name, username, email, created_at, updated_at)
SELECT 
  '2e3b68a3-76b7-4893-be29-b398fb4314f0',
  'test10',
  'test10',
  'test10@gmail.com',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = '2e3b68a3-76b7-4893-be29-b398fb4314f0'
);

INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT 
  '2e3b68a3-76b7-4893-be29-b398fb4314f0',
  'user'::app_role,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = '2e3b68a3-76b7-4893-be29-b398fb4314f0'
);