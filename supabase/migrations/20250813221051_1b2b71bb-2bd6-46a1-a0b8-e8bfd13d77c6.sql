-- Fix critical security vulnerability: Block unauthenticated access to sensitive data tables

-- 1. Fix portfolios table - add explicit policies to block anonymous access
-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "Users can view own portfolio only" ON public.portfolios;
DROP POLICY IF EXISTS "Users can create own portfolio only" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update own portfolio only" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete own portfolio only" ON public.portfolios;

-- Create secure policies that explicitly deny anonymous access
CREATE POLICY "Block anonymous access to portfolios"
ON public.portfolios
FOR ALL
TO anonymous
USING (false)
WITH CHECK (false);

-- Allow authenticated users to access only their own portfolios
CREATE POLICY "Users can view their own portfolio only"
ON public.portfolios
FOR SELECT
TO authenticated
USING (is_portfolio_owner(user_id));

CREATE POLICY "Users can create their own portfolio only"
ON public.portfolios
FOR INSERT
TO authenticated
WITH CHECK (is_portfolio_owner(user_id));

CREATE POLICY "Users can update their own portfolio only"
ON public.portfolios
FOR UPDATE
TO authenticated
USING (is_portfolio_owner(user_id))
WITH CHECK (is_portfolio_owner(user_id));

CREATE POLICY "Users can delete their own portfolio only"
ON public.portfolios
FOR DELETE
TO authenticated
USING (is_portfolio_owner(user_id));

-- 2. Fix profiles table - ensure no anonymous access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Institute admins can view profiles of their institute users" ON public.profiles;
DROP POLICY IF EXISTS "Institute admins can update profiles of their institute users" ON public.profiles;

-- Block anonymous access to profiles
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anonymous
USING (false)
WITH CHECK (false);

-- Recreate secure authenticated policies
CREATE POLICY "Users can view their own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Institute admin policies
CREATE POLICY "Institute admins can view their institute users profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'institute_admin'::app_role) AND EXISTS (
  SELECT 1 FROM user_assignments ua
  JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
  WHERE ua.user_id = profiles.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
));

CREATE POLICY "Institute admins can update their institute users profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'institute_admin'::app_role) AND EXISTS (
  SELECT 1 FROM user_assignments ua
  JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
  WHERE ua.user_id = profiles.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
));

-- 3. Fix payments table - ensure strict access control
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Edge functions can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Edge functions can update payments" ON public.payments;

-- Block anonymous access to payments
CREATE POLICY "Block anonymous access to payments"
ON public.payments
FOR ALL
TO anonymous
USING (false)
WITH CHECK (false);

-- Only allow users to view their own payments
CREATE POLICY "Users can view their own payments only"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow edge functions to manage payments (service role)
CREATE POLICY "Service role can manage payments"
ON public.payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Fix AI chat logs
DROP POLICY IF EXISTS "Users can view their own chat logs" ON public.ai_chat_logs;
DROP POLICY IF EXISTS "Users can insert their own chat logs" ON public.ai_chat_logs;
DROP POLICY IF EXISTS "Users can update their own chat logs" ON public.ai_chat_logs;
DROP POLICY IF EXISTS "Users can delete their own chat logs" ON public.ai_chat_logs;

-- Block anonymous access to chat logs
CREATE POLICY "Block anonymous access to chat logs"
ON public.ai_chat_logs
FOR ALL
TO anonymous
USING (false)
WITH CHECK (false);

-- Recreate secure policies for authenticated users
CREATE POLICY "Users can view their own chat logs only"
ON public.ai_chat_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat logs only"
ON public.ai_chat_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat logs only"
ON public.ai_chat_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat logs only"
ON public.ai_chat_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Fix resume data tables
DROP POLICY IF EXISTS "Users can view their own resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Users can create their own resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Users can update their own resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Users can delete their own resume data" ON public.resume_data;

-- Block anonymous access to resume data
CREATE POLICY "Block anonymous access to resume data"
ON public.resume_data
FOR ALL
TO anonymous
USING (false)
WITH CHECK (false);

-- Recreate secure policies
CREATE POLICY "Users can view their own resume data only"
ON public.resume_data
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume data only"
ON public.resume_data
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume data only"
ON public.resume_data
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume data only"
ON public.resume_data
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Fix saved resumes table
DROP POLICY IF EXISTS "Users can view their own saved resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Users can create their own saved resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Users can update their own saved resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Users can delete their own saved resumes" ON public.saved_resumes;

-- Block anonymous access to saved resumes
CREATE POLICY "Block anonymous access to saved resumes"
ON public.saved_resumes
FOR ALL
TO anonymous
USING (false)
WITH CHECK (false);

-- Recreate secure policies
CREATE POLICY "Users can view their own saved resumes only"
ON public.saved_resumes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved resumes only"
ON public.saved_resumes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved resumes only"
ON public.saved_resumes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved resumes only"
ON public.saved_resumes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);