-- Create missing profile and user role for existing user
INSERT INTO public.profiles (user_id, full_name, username, email, created_at, updated_at)
VALUES (
  '2e3b68a3-76b7-4893-be29-b398fb4314f0',
  'test10',
  'test10',
  'test10@gmail.com',
  now(),
  now()
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES (
  '2e3b68a3-76b7-4893-be29-b398fb4314f0',
  'user',
  now(),
  now()
) ON CONFLICT (user_id) DO NOTHING;