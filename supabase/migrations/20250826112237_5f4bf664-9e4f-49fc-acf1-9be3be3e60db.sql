-- Fix infinite recursion in profiles RLS policies by dropping ALL existing policies first
-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles; 
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Recruiters can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Premium users can view profiles for leaderboard" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Premium users can view other profiles for leaderboard" ON public.profiles;
DROP POLICY IF EXISTS "Recruiters can view all profiles" ON public.profiles;

-- Now create completely safe, non-recursive policies

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- 3. Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Admins can view all profiles (simple, no function calls)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5. Recruiters can view all profiles (simple, no function calls)
CREATE POLICY "Recruiters can view profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'recruiter'
  )
);

-- 6. Institute admins can view student profiles
CREATE POLICY "Institute admins can view student profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.institute_admin_assignments iaa ON ur.user_id = iaa.user_id
    JOIN public.user_assignments ua ON iaa.institute_id = ua.institute_id
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'institute_admin'
    AND ua.user_id = profiles.user_id
    AND iaa.is_active = true
    AND ua.is_active = true
  )
);