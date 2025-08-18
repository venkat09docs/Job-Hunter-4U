-- PHASE 2: DATABASE FUNCTION HARDENING
-- Fix search path vulnerabilities and enhance function security

-- 1. Update all existing functions to set secure search path
-- Fix handle_new_user_with_webhook function
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile with proper data extraction
  INSERT INTO public.profiles (user_id, full_name, username, email, industry)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    industry = EXCLUDED.industry,
    updated_at = now();
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Store webhook data in queue for processing (if table exists)
  INSERT INTO public.webhook_queue (user_id, user_data)
  VALUES (
    NEW.id,
    json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
      'username', COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
      'industry', COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT'),
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at,
      'email_confirmed_at', NEW.email_confirmed_at,
      'last_sign_in_at', NEW.last_sign_in_at,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'phone', NEW.phone,
      'confirmed_at', NEW.confirmed_at,
      'email_verified', CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
      'provider', 'email',
      'role', 'authenticated',
      'signup_source', 'web_application',
      'timestamp', now()
    )::jsonb
  )
  ON CONFLICT DO NOTHING; -- Ignore if webhook_queue doesn't exist
  
  RETURN NEW;
EXCEPTION
  WHEN undefined_table THEN
    -- Continue without webhook queue if table doesn't exist
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Update get_safe_admin_profiles function to sanitize data
CREATE OR REPLACE FUNCTION public.get_safe_admin_profiles(user_ids uuid[] DEFAULT NULL::uuid[])
RETURNS TABLE(
  user_id uuid, 
  full_name text, 
  username text, 
  profile_image_url text, 
  subscription_plan text, 
  subscription_active boolean, 
  subscription_start_date timestamp with time zone, 
  subscription_end_date timestamp with time zone, 
  total_resume_opens integer, 
  total_job_searches integer, 
  total_ai_queries integer, 
  industry text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    -- Sanitize personal data
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.full_name
      ELSE 'REDACTED'
    END as full_name,
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.username
      ELSE 'REDACTED'
    END as username,
    p.profile_image_url,
    p.subscription_plan,
    p.subscription_active,
    p.subscription_start_date,
    p.subscription_end_date,
    p.total_resume_opens,
    p.total_job_searches,
    p.total_ai_queries,
    p.industry,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE 
    -- Only allow if user is admin or institute admin with proper access
    (
      public.has_role(auth.uid(), 'admin'::public.app_role) 
      OR 
      (
        public.has_role(auth.uid(), 'institute_admin'::public.app_role) 
        AND EXISTS (
          SELECT 1
          FROM public.user_assignments ua
          JOIN public.institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
          WHERE ua.user_id = p.user_id 
          AND iaa.user_id = auth.uid() 
          AND ua.is_active = true 
          AND iaa.is_active = true
        )
      )
    )
    -- Filter by specific user_ids if provided
    AND (user_ids IS NULL OR p.user_id = ANY(user_ids));
$$;

-- 3. Create input validation function for metadata
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