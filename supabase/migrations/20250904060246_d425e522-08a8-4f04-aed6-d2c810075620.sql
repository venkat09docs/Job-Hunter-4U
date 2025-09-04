-- Fix the validate_role_changes function to allow user role creation during signup
CREATE OR REPLACE FUNCTION public.validate_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Allow service role to perform any role operations
    IF current_setting('role') = 'service_role' THEN
        -- Log the role change for service role operations
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
    END IF;
    
    -- Allow default 'user' role creation during signup when no auth context exists
    IF TG_OP = 'INSERT' AND auth.uid() IS NULL AND NEW.role = 'user'::app_role THEN
        -- This is likely a default role assignment during user signup
        INSERT INTO public.role_audit_log (
            user_id,
            target_user_id,
            old_role,
            new_role,
            action
        ) VALUES (
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
            NEW.user_id,
            NULL,
            NEW.role,
            'SIGNUP_DEFAULT'
        );
        RETURN NEW;
    END IF;
    
    -- For authenticated operations, enforce stricter validation
    IF auth.uid() IS NOT NULL THEN
        -- Prevent users from modifying their own roles
        IF NEW.user_id = auth.uid() THEN
            RAISE EXCEPTION 'Users cannot modify their own roles';
        END IF;
        
        -- Only admins can modify roles
        IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
            RAISE EXCEPTION 'Insufficient privileges to modify user roles';
        END IF;
    ELSE
        -- If no auth context and not a default user role creation, require authentication
        IF NOT (TG_OP = 'INSERT' AND NEW.role = 'user'::app_role) THEN
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