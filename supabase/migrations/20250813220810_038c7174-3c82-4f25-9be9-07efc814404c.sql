-- Fix critical security issues with RLS policies

-- 1. Tighten user_roles table security
-- First, drop existing permissive policies and create secure ones
DROP POLICY IF EXISTS "Super admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create secure policies for user_roles table
CREATE POLICY "Super admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles only"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Prevent users from modifying their own roles
CREATE POLICY "Prevent user self-role modification"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Prevent user role updates except by admins"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Prevent user role deletion except by admins"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Restrict leaderboard access to authenticated users only
DROP POLICY IF EXISTS "Everyone can view leaderboard rankings" ON public.leaderboard_rankings;

CREATE POLICY "Authenticated users can view leaderboard rankings"
ON public.leaderboard_rankings
FOR SELECT
TO authenticated
USING (true);

-- Keep system management but make it more restrictive
DROP POLICY IF EXISTS "System can manage leaderboard rankings" ON public.leaderboard_rankings;

CREATE POLICY "Admins and system can manage leaderboard rankings"
ON public.leaderboard_rankings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions to insert/update leaderboard data
CREATE POLICY "Edge functions can manage leaderboard data"
ON public.leaderboard_rankings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Add audit logging for role changes (create audit table if it doesn't exist with proper structure)
CREATE TABLE IF NOT EXISTS public.role_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    target_user_id uuid NOT NULL,
    old_role app_role,
    new_role app_role NOT NULL,
    action text NOT NULL, -- 'assign', 'revoke', 'update'
    timestamp timestamp with time zone NOT NULL DEFAULT now(),
    ip_address inet,
    user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view role audit logs
CREATE POLICY "Admins can view role audit logs"
ON public.role_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert role audit logs"
ON public.role_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Create function to safely assign roles with audit logging
CREATE OR REPLACE FUNCTION public.assign_user_role(
    target_user_id uuid,
    new_role app_role,
    action_type text DEFAULT 'assign'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;