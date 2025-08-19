-- Fix RLS policy for admin access to profiles
-- Drop the existing policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a more robust admin policy that also checks the user_roles table directly
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  )
);

-- Also ensure there's a policy for users to view their own profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT 
USING (auth.uid() = user_id);