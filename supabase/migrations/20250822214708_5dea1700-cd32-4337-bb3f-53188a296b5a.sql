-- CRITICAL SECURITY FIXES - Phase 1 (Fixed)

-- 1. Fix profiles table RLS policies - CRITICAL
-- Check and remove existing overly permissive policies
DROP POLICY IF EXISTS "Institute admins can view student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Recruiters can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Institute admins can view basic assigned student info" ON public.profiles;

-- Temporarily drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles; 
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

-- Create safer, more restrictive policies for profiles
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile only"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Super admins can still manage profiles for administrative purposes
CREATE POLICY "Super admins full profile access"
ON public.profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix payment table RLS policies 
DROP POLICY IF EXISTS "Users can view payment history" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments only" ON public.payments;
DROP POLICY IF EXISTS "Only service role can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Only service role can update payment status" ON public.payments;
DROP POLICY IF EXISTS "Super admins can view all payments" ON public.payments;

-- Create stricter payment policies
CREATE POLICY "Users view own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role insert payments"
ON public.payments
FOR INSERT
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role update payments"
ON public.payments
FOR UPDATE
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Admins view all payments"
ON public.payments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Strengthen role security
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins manage all roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Add security audit logging table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  table_name text,
  record_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for audit log
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;

CREATE POLICY "Admins view audit logs"
ON public.security_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- 5. Fix resume data access policy
DROP POLICY IF EXISTS "Institute admins can view student resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Institute admins can view assigned student resume data" ON public.resume_data;

-- Users can always view their own resume data
CREATE POLICY "Users view own resume data"
ON public.resume_data
FOR SELECT
USING (auth.uid() = user_id);

-- Users can manage their own resume data
CREATE POLICY "Users manage own resume data"
ON public.resume_data
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Super admins can view all resume data
CREATE POLICY "Admins view all resume data"
ON public.resume_data
FOR SELECT  
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Fix AI chat logs to be more secure
DROP POLICY IF EXISTS "Block all anonymous access to chat logs" ON public.ai_chat_logs;

-- Ensure only users can access their own chat logs
CREATE POLICY "Block anonymous chat access"
ON public.ai_chat_logs
FOR ALL
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);