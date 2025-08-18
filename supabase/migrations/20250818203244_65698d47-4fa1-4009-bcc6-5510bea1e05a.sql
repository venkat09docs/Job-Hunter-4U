-- PHASE 1B: ROLE SECURITY FIXES (Non-conflicting approach)
-- Add role audit logging and validation without conflicting policies

-- 1. Create role audit log table if it doesn't exist
DO $$
BEGIN
    -- Check if table exists before creating
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_audit_log') THEN
        CREATE TABLE public.role_audit_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            target_user_id UUID NOT NULL,
            old_role app_role,
            new_role app_role,
            action TEXT NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
            ip_address INET,
            user_agent TEXT
        );
        
        -- Enable RLS
        ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Admins can view role audit logs"
        ON public.role_audit_log
        FOR SELECT
        TO authenticated
        USING (has_role(auth.uid(), 'admin'::app_role));
        
        CREATE POLICY "System can insert role audit logs"
        ON public.role_audit_log
        FOR INSERT
        WITH CHECK (true);
    END IF;
END
$$;

-- 2. Create role validation trigger if it doesn't exist
CREATE OR REPLACE FUNCTION public.validate_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'validate_role_changes_trigger'
    ) THEN
        CREATE TRIGGER validate_role_changes_trigger
            BEFORE INSERT OR UPDATE ON public.user_roles
            FOR EACH ROW
            EXECUTE FUNCTION public.validate_role_changes();
    END IF;
END
$$;