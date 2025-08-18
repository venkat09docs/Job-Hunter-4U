-- PHASE 1: CRITICAL ROLE SECURITY FIXES
-- Fix role escalation vulnerability and add security constraints

-- 1. Create secure role management function with audit logging
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Who performed the action
  target_user_id UUID NOT NULL, -- Who was affected
  old_role app_role,
  new_role app_role,
  action TEXT NOT NULL, -- 'assign', 'revoke', 'update'
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit log
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view role audit logs"
ON public.role_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert role audit logs"
ON public.role_audit_log
FOR INSERT
WITH CHECK (true);

-- 2. Create secure role assignment function
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role app_role,
  action_type TEXT DEFAULT 'assign'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_role app_role;
    requesting_user_id UUID := auth.uid();
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
$$;

-- 3. Create role validation trigger to prevent unauthorized role changes
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
    
    RETURN NEW;
END;
$$;

-- Create trigger for role validation
DROP TRIGGER IF EXISTS validate_role_changes_trigger ON public.user_roles;
CREATE TRIGGER validate_role_changes_trigger
    BEFORE INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_role_changes();

-- 4. Add additional RLS policies for user_roles table
DROP POLICY IF EXISTS "Prevent self role modification" ON public.user_roles;
CREATE POLICY "Prevent self role modification"
ON public.user_roles
FOR ALL
TO authenticated
USING (user_id != auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id != auth.uid() OR has_role(auth.uid(), 'admin'::app_role));