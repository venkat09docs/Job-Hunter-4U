-- Security Fix Phase 2 Continued: Fix remaining database functions without search_path

CREATE OR REPLACE FUNCTION public.validate_chat_log_ownership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure user_id matches the authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create or modify chat logs for another user';
  END IF;
  
  -- Ensure we have a valid authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for chat log operations';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_portfolio_ownership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure the user_id matches the authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create or modify portfolio for another user';
  END IF;
  
  -- Additional validation: ensure sensitive data is properly handled
  -- Log access attempts for audit purposes (optional)
  INSERT INTO public.audit_log (table_name, action, user_id, timestamp)
  VALUES ('portfolios', TG_OP, auth.uid(), NOW())
  ON CONFLICT DO NOTHING; -- Ignore if audit_log table doesn't exist
  
  RETURN NEW;
EXCEPTION
  WHEN undefined_table THEN
    -- If audit_log table doesn't exist, continue without logging
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_resume_ownership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure the user_id matches the authenticated user (except for service role)
  IF current_setting('role') != 'service_role' THEN
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create or modify resume data for another user';
    END IF;
    
    -- Ensure we have a valid authenticated user
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required for resume operations';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_role_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Prevent users from modifying their own roles (except service role)
    IF current_setting('role') != 'service_role' THEN
        -- Check if user is trying to modify their own role
        IF NEW.user_id = auth.uid() THEN
            RAISE EXCEPTION 'Users cannot modify their own roles';
        END IF;
        
        -- Only admins can modify roles
        IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
            RAISE EXCEPTION 'Insufficient privileges to modify user roles';
        END IF;
        
        -- Ensure authenticated user
        IF auth.uid() IS NULL THEN
            RAISE EXCEPTION 'Authentication required for role operations';
        END IF;
    END IF;
    
    -- Log the role change
    INSERT INTO public.role_audit_log (
        user_id,
        target_user_id,
        old_role,
        new_role,
        action
    ) VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        NEW.user_id,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.role ELSE NULL END,
        NEW.role,
        TG_OP
    );
    
    RETURN NEW;
END;
$function$;