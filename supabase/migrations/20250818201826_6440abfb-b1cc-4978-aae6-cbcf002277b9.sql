-- Remove the problematic views that triggered security warnings
DROP VIEW IF EXISTS public.institutes_public_view;
DROP VIEW IF EXISTS public.institutes_safe_view;

-- Instead of views, create a more secure function-based approach
-- This function returns institute data with proper access control and excludes sensitive contact info for regular users
CREATE OR REPLACE FUNCTION public.get_user_accessible_institutes_safe()
RETURNS TABLE(
  id uuid, 
  name text, 
  code text, 
  description text, 
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  subscription_plan text,
  subscription_active boolean,
  subscription_start_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  max_students integer,
  current_student_count integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    i.id,
    i.name,
    i.code,
    i.description,
    i.is_active,
    i.created_at,
    i.updated_at,
    i.subscription_plan,
    i.subscription_active,
    i.subscription_start_date,
    i.subscription_end_date,
    i.max_students,
    i.current_student_count
  FROM public.institutes i
  WHERE i.is_active = true
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.institute_id = i.id 
    AND ua.user_id = auth.uid() 
    AND ua.is_active = true
  );
$$;

-- Create function for admin access (includes sensitive contact information)
CREATE OR REPLACE FUNCTION public.get_institutes_admin_access()
RETURNS TABLE(
  id uuid,
  name text,
  code text, 
  description text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  subscription_plan text,
  subscription_active boolean,
  subscription_start_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  max_students integer,
  current_student_count integer,
  contact_email text,
  contact_phone text,
  address text,
  created_by uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    i.id,
    i.name,
    i.code,
    i.description,
    i.is_active,
    i.created_at,
    i.updated_at,
    i.subscription_plan,
    i.subscription_active,
    i.subscription_start_date,
    i.subscription_end_date,
    i.max_students,
    i.current_student_count,
    i.contact_email,
    i.contact_phone,
    i.address,
    i.created_by
  FROM public.institutes i
  WHERE (
    -- Super admins can see all institutes
    has_role(auth.uid(), 'admin'::app_role)
    OR 
    -- Institute admins can see their assigned institutes
    (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM institute_admin_assignments iaa
        WHERE iaa.user_id = auth.uid() 
        AND iaa.institute_id = i.id 
        AND iaa.is_active = true
      )
    )
  );
$$;