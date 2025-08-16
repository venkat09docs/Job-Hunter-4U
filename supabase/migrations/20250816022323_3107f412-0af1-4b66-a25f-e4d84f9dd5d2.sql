-- Drop the existing restrictive policy
DROP POLICY "Deny all access to profiles for unauthorized users" ON public.profiles;

-- Create a new restrictive policy that allows leaderboard access
CREATE POLICY "Restrict profile access with leaderboard exception"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (
  -- Users can access their own profiles
  (auth.uid() = user_id) 
  OR 
  -- Admins can access all profiles
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  -- Institute admins can access their assigned users
  (has_role(auth.uid(), 'institute_admin'::app_role) AND (EXISTS (
    SELECT 1
    FROM (user_assignments ua JOIN institute_admin_assignments iaa ON ((ua.institute_id = iaa.institute_id)))
    WHERE ((ua.user_id = profiles.user_id) AND (iaa.user_id = auth.uid()) AND (ua.is_active = true) AND (iaa.is_active = true))
  )))
  OR 
  -- Allow all authenticated users to view basic profile info for leaderboard (name, username, image only)
  (auth.role() = 'authenticated')
);