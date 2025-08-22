-- Fix remaining security warnings - Database Functions Search Path

-- Update all remaining functions to have secure search_path
CREATE OR REPLACE FUNCTION public.validate_user_metadata(metadata jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  clean_metadata jsonb := '{}';
  allowed_keys text[] := ARRAY['full_name', 'username', 'industry', 'Display Name'];
  key text;
BEGIN
  -- Only allow specific keys and sanitize values
  FOR key IN SELECT jsonb_object_keys(metadata)
  LOOP
    IF key = ANY(allowed_keys) THEN
      -- Sanitize string values (remove potential HTML/script content)
      IF jsonb_typeof(metadata -> key) = 'string' THEN
        clean_metadata := clean_metadata || jsonb_build_object(
          key, 
          regexp_replace(
            regexp_replace(metadata ->> key, '<[^>]*>', '', 'g'), 
            '[^\w\s@.-]', '', 'g'
          )
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN clean_metadata;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_subscription_days_remaining(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  end_date TIMESTAMPTZ;
  remaining_days INTEGER;
BEGIN
  SELECT subscription_end_date INTO end_date
  FROM public.profiles
  WHERE user_id = user_id_param;
  
  IF end_date IS NULL THEN
    RETURN 0;
  END IF;
  
  remaining_days := EXTRACT(DAY FROM (end_date - NOW()));
  
  IF remaining_days < 0 THEN
    RETURN 0;
  END IF;
  
  RETURN remaining_days;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id uuid, new_role app_role, action_type text DEFAULT 'assign'::text)
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

CREATE OR REPLACE FUNCTION public.upsert_resume_data(p_user_id uuid, p_personal_details jsonb, p_experience jsonb, p_education jsonb, p_skills_interests jsonb, p_certifications_awards jsonb, p_professional_summary text, p_status text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO public.resume_data (
    user_id,
    personal_details,
    experience,
    education,
    skills_interests,
    certifications_awards,
    professional_summary,
    status,
    updated_at
  ) VALUES (
    p_user_id,
    p_personal_details,
    p_experience,
    p_education,
    p_skills_interests,
    p_certifications_awards,
    p_professional_summary,
    p_status,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    personal_details = EXCLUDED.personal_details,
    experience = EXCLUDED.experience,
    education = EXCLUDED.education,
    skills_interests = EXCLUDED.skills_interests,
    certifications_awards = EXCLUDED.certifications_awards,
    professional_summary = EXCLUDED.professional_summary,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;