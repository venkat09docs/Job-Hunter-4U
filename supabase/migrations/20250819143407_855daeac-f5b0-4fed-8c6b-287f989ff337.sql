-- First, let's see which users are missing profiles
DO $$
DECLARE
    missing_count integer;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE p.user_id IS NULL;
    
    RAISE NOTICE 'Found % users missing profiles', missing_count;
END
$$;

-- Create the trigger properly to auto-create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_webhook();

-- Sync missing profiles immediately
INSERT INTO public.profiles (user_id, full_name, username, email, industry)
SELECT 
    au.id as user_id,
    COALESCE(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'Display Name', split_part(au.email, '@', 1)) as full_name,
    -- Generate unique usernames to avoid conflicts
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles WHERE username = COALESCE(au.raw_user_meta_data ->> 'username', split_part(au.email, '@', 1)))
        THEN COALESCE(au.raw_user_meta_data ->> 'username', split_part(au.email, '@', 1)) || '_' || EXTRACT(epoch FROM au.created_at)::bigint::text
        ELSE COALESCE(au.raw_user_meta_data ->> 'username', split_part(au.email, '@', 1))
    END as username,
    au.email,
    COALESCE(au.raw_user_meta_data ->> 'industry', 'IT') as industry
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- Ensure all users have default roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
    au.id as user_id,
    'user'::app_role as role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id AND ur.role = 'user'::app_role
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;