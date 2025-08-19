-- Temporarily disable the profile validation trigger
DROP TRIGGER IF EXISTS validate_profile_ownership ON public.profiles;

-- Insert missing profiles directly
INSERT INTO public.profiles (user_id, full_name, username, email, industry)
SELECT 
  au.id as user_id,
  COALESCE(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'Display Name', split_part(au.email, '@', 1)) as full_name,
  COALESCE(au.raw_user_meta_data ->> 'username', split_part(au.email, '@', 1)) as username,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'industry', 'IT') as industry
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- Also ensure all users have default 'user' role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id as user_id,
  'user'::app_role as role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id AND ur.role = 'user'::app_role
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Restore the validation trigger
CREATE TRIGGER validate_profile_ownership
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_ownership_strict();