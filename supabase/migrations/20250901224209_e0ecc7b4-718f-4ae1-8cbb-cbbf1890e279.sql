-- Create a function to safely get user info for affiliate referrals
CREATE OR REPLACE FUNCTION get_affiliate_referral_users(user_ids UUID[])
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  username TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- First try to get from profiles table
  SELECT 
    p.user_id,
    p.full_name,
    p.username,
    p.email
  FROM public.profiles p
  WHERE p.user_id = ANY(user_ids)
  
  UNION ALL
  
  -- For users not in profiles, get from auth.users
  SELECT 
    au.id as user_id,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'username', 
      split_part(au.email, '@', 1)
    ) as full_name,
    COALESCE(
      au.raw_user_meta_data->>'username',
      split_part(au.email, '@', 1)
    ) as username,
    au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids)
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = au.id
    );
END;
$$;