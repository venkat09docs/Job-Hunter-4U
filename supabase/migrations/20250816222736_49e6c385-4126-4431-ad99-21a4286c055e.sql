-- Remove all dangerous policies that allow broad profile access
DROP POLICY IF EXISTS "Restrict profile access with leaderboard exception" ON public.profiles;
DROP POLICY IF EXISTS "Restricted profile access for leaderboard" ON public.profiles;

-- Ensure we only have secure, specific policies
-- These policies ensure users can only see their own data, admins can see all, 
-- and institute admins can only see their assigned students

-- Verify our secure policies are in place (recreate if needed)
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Institute admins can view their institute users profiles" ON public.profiles;
CREATE POLICY "Institute admins can view their institute users profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = profiles.user_id 
      AND iaa.user_id = auth.uid() 
      AND ua.is_active = true 
      AND iaa.is_active = true
  )
);