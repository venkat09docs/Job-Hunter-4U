-- Create a service function to sync missing profiles from auth.users
CREATE OR REPLACE FUNCTION public.sync_missing_user_profiles()
RETURNS INT AS $$
DECLARE
  profile_count INT := 0;
BEGIN
  -- Insert missing profiles using service role privileges
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
  
  GET DIAGNOSTICS profile_count = ROW_COUNT;
  
  -- Also ensure all users have default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  SELECT 
    au.id as user_id,
    'user'::app_role as role
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id AND ur.role = 'user'::app_role
  WHERE ur.user_id IS NULL
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN profile_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now execute the function to sync profiles
SELECT public.sync_missing_user_profiles();