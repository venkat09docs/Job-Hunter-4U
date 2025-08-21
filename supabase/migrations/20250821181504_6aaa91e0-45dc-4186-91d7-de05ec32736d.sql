-- Security Fix Phase 1: Restrict LinkedIn Performance Data Access
-- Update RLS policies to prevent public access to user performance data

-- Drop existing overly permissive policies for linkedin_user_tasks
DROP POLICY IF EXISTS "Users can manage their own LinkedIn user tasks" ON public.linkedin_user_tasks;

-- Create secure RLS policies for linkedin_user_tasks
CREATE POLICY "Users can manage their own LinkedIn user tasks" 
ON public.linkedin_user_tasks 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add institute admin access for educational oversight
CREATE POLICY "Institute admins can view student LinkedIn tasks" 
ON public.linkedin_user_tasks 
FOR SELECT
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- Drop existing overly permissive policies for linkedin_scores
DROP POLICY IF EXISTS "Users can view their own LinkedIn scores" ON public.linkedin_scores;

-- Create secure RLS policies for linkedin_scores
CREATE POLICY "Users can view their own LinkedIn scores" 
ON public.linkedin_scores 
FOR SELECT
USING (auth.uid() = user_id);

-- Add institute admin access for educational oversight
CREATE POLICY "Institute admins can view student LinkedIn scores" 
ON public.linkedin_scores 
FOR SELECT
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = linkedin_scores.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- Security Fix Phase 2: Harden Database Functions with proper search_path
-- Update functions to prevent schema injection attacks

CREATE OR REPLACE FUNCTION public.prevent_update_on_completed_sessions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.completed = true THEN
    RAISE EXCEPTION 'Completed sessions cannot be modified';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_linkedin_user_tasks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_job_hunting_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_github_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_learning_goals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_payment_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure user_id matches the authenticated user (if not service role)
  IF auth.role() != 'service_role' THEN
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create or modify payments for another user';
    END IF;
    
    -- Ensure we have a valid authenticated user
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required for payment operations';
    END IF;
    
    -- Prevent users from modifying critical payment fields
    IF TG_OP = 'UPDATE' THEN
      IF OLD.razorpay_payment_id IS DISTINCT FROM NEW.razorpay_payment_id 
         OR OLD.razorpay_order_id IS DISTINCT FROM NEW.razorpay_order_id
         OR OLD.amount IS DISTINCT FROM NEW.amount THEN
        RAISE EXCEPTION 'Cannot modify critical payment fields: payment_id, order_id, amount';
      END IF;
    END IF;
  END IF;
  
  -- Validate payment amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;
  
  -- Ensure required fields are present
  IF NEW.plan_name IS NULL OR NEW.plan_name = '' THEN
    RAISE EXCEPTION 'Plan name is required';
  END IF;
  
  -- Validate status values
  IF NEW.status NOT IN ('pending', 'completed', 'failed', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Invalid payment status';
  END IF;
  
  RETURN NEW;
END;
$function$;