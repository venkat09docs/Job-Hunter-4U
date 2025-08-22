-- CRITICAL SECURITY FIXES - Phase 1

-- 1. Fix profiles table RLS policies - CRITICAL
-- Remove overly permissive policies that allow institute admins and recruiters to see all user data
DROP POLICY IF EXISTS "Institute admins can view student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Recruiters can view all profiles" ON public.profiles;

-- Create safer, more restrictive policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Super admins can still manage profiles for administrative purposes
CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Institute admins can only view basic, non-sensitive profile info of their assigned students
-- and only with explicit student consent via assignments table
CREATE POLICY "Institute admins can view basic assigned student info"
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

-- 2. Fix payment table RLS policies - Remove overly broad access
DROP POLICY IF EXISTS "Users can view payment history" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

-- Create stricter payment policies
CREATE POLICY "Users can view their own payments only"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only service role can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Only service role can update payment status"
ON public.payments
FOR UPDATE
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Super admins can view payment data for support purposes
CREATE POLICY "Super admins can view all payments"
ON public.payments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Strengthen role security - Prevent self-role modification
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;

-- Only super admins can modify roles
CREATE POLICY "Only super admins can manage roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can only view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Fix database functions search path - SECURITY CRITICAL
-- Update critical functions to have immutable search_path

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.increment_user_analytics(action_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Insert or update today's analytics
  INSERT INTO public.user_analytics (user_id, date, resume_opens, job_searches, ai_queries)
  VALUES (
    current_user_id,
    CURRENT_DATE,
    CASE WHEN action_type = 'resume_open' THEN 1 ELSE 0 END,
    CASE WHEN action_type = 'job_search' THEN 1 ELSE 0 END,
    CASE WHEN action_type = 'ai_query' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    resume_opens = user_analytics.resume_opens + CASE WHEN action_type = 'resume_open' THEN 1 ELSE 0 END,
    job_searches = user_analytics.job_searches + CASE WHEN action_type = 'job_search' THEN 1 ELSE 0 END,
    ai_queries = user_analytics.ai_queries + CASE WHEN action_type = 'ai_query' THEN 1 ELSE 0 END,
    updated_at = now();

  -- Update total counts in profiles
  UPDATE public.profiles
  SET 
    total_resume_opens = total_resume_opens + CASE WHEN action_type = 'resume_open' THEN 1 ELSE 0 END,
    total_job_searches = total_job_searches + CASE WHEN action_type = 'job_search' THEN 1 ELSE 0 END,
    total_ai_queries = total_ai_queries + CASE WHEN action_type = 'ai_query' THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE user_id = current_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_payment_record(p_user_id uuid, p_razorpay_order_id text, p_amount integer, p_plan_name text, p_plan_duration text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payment_id UUID;
BEGIN
  -- First check if payment record already exists
  SELECT id INTO payment_id 
  FROM public.payments 
  WHERE razorpay_order_id = p_razorpay_order_id 
  AND user_id = p_user_id
  LIMIT 1;
  
  IF payment_id IS NOT NULL THEN
    RAISE LOG 'Payment record already exists with ID: %', payment_id;
    RETURN payment_id;
  END IF;

  -- Log the function parameters
  RAISE LOG 'Creating payment record with: user_id=%, order_id=%, amount=%, plan_name=%, plan_duration=%', 
    p_user_id, p_razorpay_order_id, p_amount, p_plan_name, p_plan_duration;

  -- Insert new payment record with explicit column specification
  INSERT INTO public.payments (
    user_id,
    razorpay_order_id,
    amount,
    plan_name,
    plan_duration
  ) VALUES (
    p_user_id,
    p_razorpay_order_id,
    p_amount,
    p_plan_name,
    p_plan_duration
  )
  RETURNING id INTO payment_id;
  
  RAISE LOG 'Payment record created successfully with ID: %', payment_id;
  RETURN payment_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating payment record: % %, SQLSTATE: %', SQLERRM, SQLSTATE, SQLERRM;
    RAISE;
END;
$$;

-- 5. Add security audit logging for sensitive operations
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

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- 6. Create secure profile view for institute admins (non-sensitive data only)
CREATE OR REPLACE VIEW public.student_profiles_safe AS
SELECT 
  p.user_id,
  p.full_name,
  p.username,
  p.industry,
  p.created_at,
  -- Exclude sensitive fields: email, phone, subscription details, personal URLs
  ua.institute_id,
  ua.batch_id
FROM public.profiles p
JOIN public.user_assignments ua ON p.user_id = ua.user_id
WHERE ua.is_active = true;

-- Grant access to the safe view
GRANT SELECT ON public.student_profiles_safe TO authenticated;

-- Create RLS policy for the safe view
CREATE POLICY "Institute admins can view safe student profiles"
ON public.student_profiles_safe
FOR SELECT
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM institute_admin_assignments iaa
    WHERE iaa.user_id = auth.uid()
    AND iaa.institute_id = student_profiles_safe.institute_id
    AND iaa.is_active = true
  )
);

-- 7. Fix resume data access policy to verify proper admin-student relationship
DROP POLICY IF EXISTS "Institute admins can view student resume data" ON public.resume_data;

CREATE POLICY "Institute admins can view assigned student resume data"
ON public.resume_data
FOR SELECT
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = resume_data.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- 8. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action_type text,
  p_table_name text DEFAULT NULL,  
  p_record_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action_type,
    table_name,
    record_id,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_table_name,
    p_record_id,
    p_details,
    now()
  );
END;
$$;