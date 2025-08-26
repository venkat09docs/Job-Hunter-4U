-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Premium users can view other profiles for leaderboard" ON public.profiles;
DROP POLICY IF EXISTS "Recruiters can view all profiles" ON public.profiles;

-- Create safe, non-recursive policies
-- 1. Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- 3. Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Allow admins to view all profiles (simple, no function calls)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5. Allow recruiters to view all profiles (simple, no function calls)
CREATE POLICY "Recruiters can view profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'recruiter'
  )
);

-- 6. Allow premium users to view other profiles for leaderboard (no recursive functions)
CREATE POLICY "Premium users can view profiles for leaderboard"
ON public.profiles
FOR SELECT
USING (
  -- Allow if user has eligible subscription plan
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.subscription_active = true
    AND p.subscription_plan IN ('3 Months Plan', '6 Months Plan', '1 Year Plan')
  )
);