-- PHASE 3B: FIX ALL REMAINING FUNCTION SEARCH PATHS
-- Update all remaining functions to use secure search paths

-- 1. Fix trigger functions
CREATE OR REPLACE FUNCTION public.assign_institute_subscription_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  institute_sub_plan TEXT;
  institute_sub_start TIMESTAMPTZ;
  institute_sub_end TIMESTAMPTZ;
  institute_sub_active BOOLEAN;
BEGIN
  -- Get institute subscription details
  SELECT subscription_plan, subscription_start_date, subscription_end_date, subscription_active
  INTO institute_sub_plan, institute_sub_start, institute_sub_end, institute_sub_active
  FROM public.institutes
  WHERE id = NEW.institute_id;
  
  -- If institute has active subscription, assign to user profile
  IF institute_sub_active AND institute_sub_plan IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      subscription_plan = institute_sub_plan,
      subscription_start_date = institute_sub_start,
      subscription_end_date = institute_sub_end,
      subscription_active = true,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_payment_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audit_details jsonb := '{}';
BEGIN
  -- Build audit details
  IF TG_OP = 'INSERT' THEN
    audit_details := jsonb_build_object(
      'operation', 'INSERT',
      'new_data', row_to_json(NEW),
      'amount', NEW.amount,
      'plan_name', NEW.plan_name,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    audit_details := jsonb_build_object(
      'operation', 'UPDATE',
      'old_data', row_to_json(OLD),
      'new_data', row_to_json(NEW),
      'changed_fields', (
        SELECT json_object_agg(key, value)
        FROM json_each_text(row_to_json(NEW))
        WHERE value IS DISTINCT FROM (row_to_json(OLD) ->> key)
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    audit_details := jsonb_build_object(
      'operation', 'DELETE',
      'deleted_data', row_to_json(OLD)
    );
  END IF;

  -- Log the audit entry
  INSERT INTO public.payment_audit_log (
    payment_id,
    user_id,
    action,
    details,
    performed_by_role
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    audit_details,
    COALESCE(auth.role(), 'unknown')
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_payment_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audit_details jsonb := '{}';
  current_user_id uuid := auth.uid();
  current_role text := current_setting('role');
BEGIN
  -- Build audit details based on operation type
  IF TG_OP = 'INSERT' THEN
    audit_details := jsonb_build_object(
      'operation', 'INSERT',
      'new_data', row_to_json(NEW),
      'amount', NEW.amount,
      'plan_name', NEW.plan_name,
      'status', NEW.status,
      'payment_method', 'razorpay'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    audit_details := jsonb_build_object(
      'operation', 'UPDATE',
      'old_status', OLD.status,
      'new_status', NEW.status,
      'changed_fields', (
        SELECT json_object_agg(key, value)
        FROM json_each_text(row_to_json(NEW))
        WHERE value IS DISTINCT FROM (row_to_json(OLD) ->> key)
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    audit_details := jsonb_build_object(
      'operation', 'DELETE',
      'deleted_data', row_to_json(OLD),
      'amount', OLD.amount,
      'final_status', OLD.status
    );
  END IF;

  -- Log the audit entry
  INSERT INTO public.payment_audit_log (
    payment_id,
    user_id,
    action,
    details,
    performed_by_role,
    timestamp
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    audit_details,
    current_role
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;