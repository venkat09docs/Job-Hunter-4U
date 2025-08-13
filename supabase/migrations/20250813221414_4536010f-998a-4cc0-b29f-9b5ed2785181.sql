-- Add explicit restrictive policies to completely secure sensitive data tables
-- This ensures no default permissive behavior can expose data

-- Create explicit restrictive policies for each sensitive table
-- These policies will ensure that even if Supabase has permissive defaults, 
-- our restrictive policies take precedence

-- 1. Add restrictive policy for portfolios
CREATE POLICY "Deny all access to portfolios for non-owners"
ON public.portfolios
AS RESTRICTIVE
FOR ALL
USING (is_portfolio_owner(user_id))
WITH CHECK (is_portfolio_owner(user_id));

-- 2. Add restrictive policy for profiles
CREATE POLICY "Deny all access to profiles for unauthorized users"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'institute_admin'::app_role) AND EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = profiles.user_id 
      AND iaa.user_id = auth.uid() 
      AND ua.is_active = true 
      AND iaa.is_active = true
  ))
)
WITH CHECK (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'institute_admin'::app_role) AND EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = profiles.user_id 
      AND iaa.user_id = auth.uid() 
      AND ua.is_active = true 
      AND iaa.is_active = true
  ))
);

-- 3. Add restrictive policy for payments
CREATE POLICY "Deny all access to payments for non-owners"
ON public.payments
AS RESTRICTIVE
FOR ALL
USING (auth.uid() = user_id OR auth.role() = 'service_role')
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- 4. Add restrictive policy for ai_chat_logs
CREATE POLICY "Deny all access to chat logs for non-owners"
ON public.ai_chat_logs
AS RESTRICTIVE
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Add restrictive policy for resume_data
CREATE POLICY "Deny all access to resume data for non-owners"
ON public.resume_data
AS RESTRICTIVE
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Add restrictive policy for saved_resumes
CREATE POLICY "Deny all access to saved resumes for non-owners"
ON public.saved_resumes
AS RESTRICTIVE
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Additional security: Ensure all tables require authentication
-- Create default deny policies that block anonymous access

-- For portfolios
CREATE POLICY "Require authentication for portfolios"
ON public.portfolios
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- For profiles  
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- For payments
CREATE POLICY "Require authentication for payments"
ON public.payments
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- For ai_chat_logs
CREATE POLICY "Require authentication for chat logs"
ON public.ai_chat_logs
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- For resume_data
CREATE POLICY "Require authentication for resume data"
ON public.resume_data
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- For saved_resumes
CREATE POLICY "Require authentication for saved resumes"
ON public.saved_resumes
FOR ALL
TO anon
USING (false)
WITH CHECK (false);