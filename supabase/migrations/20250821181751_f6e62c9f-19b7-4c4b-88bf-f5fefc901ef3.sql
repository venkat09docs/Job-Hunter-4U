-- Security Fix Phase 3: Fix all remaining database functions without search_path

CREATE OR REPLACE FUNCTION public.assign_institute_subscription_to_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id uuid, new_role app_role, action_type text DEFAULT 'assign'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_role app_role;
    requesting_user_id uuid := auth.uid();
BEGIN
    -- Only admins can assign roles
    IF NOT has_role(requesting_user_id, 'admin'::app_role) THEN
        RAISE EXCEPTION 'Insufficient privileges to assign roles';
    END IF;
    
    -- Get current role for audit
    SELECT role INTO current_role 
    FROM public.user_roles 
    WHERE user_id = target_user_id 
    LIMIT 1;
    
    -- Begin transaction for role assignment
    BEGIN
        IF action_type = 'assign' THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (target_user_id, new_role)
            ON CONFLICT (user_id, role) DO NOTHING;
        ELSIF action_type = 'update' THEN
            UPDATE public.user_roles 
            SET role = new_role 
            WHERE user_id = target_user_id AND role = current_role;
        ELSIF action_type = 'revoke' THEN
            DELETE FROM public.user_roles 
            WHERE user_id = target_user_id AND role = new_role;
        END IF;
        
        -- Log the action
        INSERT INTO public.role_audit_log (
            user_id, 
            target_user_id, 
            old_role, 
            new_role, 
            action
        ) VALUES (
            requesting_user_id,
            target_user_id,
            current_role,
            new_role,
            action_type
        );
        
        RETURN true;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Role assignment failed: %', SQLERRM;
    END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_payment_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.audit_payment_operations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;