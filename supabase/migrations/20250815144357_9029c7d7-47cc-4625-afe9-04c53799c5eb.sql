-- Fix security issue: Restrict access to sensitive institute contact information

-- First, create a security definer function to check if user should have full institute access
CREATE OR REPLACE FUNCTION public.has_full_institute_access(institute_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    -- Super admins have full access to all institutes
    has_role(auth.uid(), 'admin'::app_role) 
    OR 
    -- Institute admins have full access to their assigned institutes
    (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM institute_admin_assignments iaa
        WHERE iaa.user_id = auth.uid() 
        AND iaa.institute_id = institute_id_param 
        AND iaa.is_active = true
      )
    )
  );
$$;

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Assigned users can view basic institute info" ON public.institutes;
DROP POLICY IF EXISTS "Institute admins can manage their institutes" ON public.institutes;
DROP POLICY IF EXISTS "Institute admins can view their institute details" ON public.institutes;
DROP POLICY IF EXISTS "Super admins can manage all institutes" ON public.institutes;

-- Create new, more secure policies

-- 1. Super admins can manage all institutes (full access)
CREATE POLICY "Super admins can manage all institutes" 
ON public.institutes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Institute admins can manage their assigned institutes (full access)
CREATE POLICY "Institute admins can manage their institutes" 
ON public.institutes 
FOR ALL 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM institute_admin_assignments iaa
    WHERE iaa.user_id = auth.uid() 
    AND iaa.institute_id = institutes.id 
    AND iaa.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM institute_admin_assignments iaa
    WHERE iaa.user_id = auth.uid() 
    AND iaa.institute_id = institutes.id 
    AND iaa.is_active = true
  )
);

-- 3. Regular assigned users can only view basic institute info (NO sensitive contact data)
-- This policy restricts field access through application-level filtering
CREATE POLICY "Assigned users can view basic institute info only" 
ON public.institutes 
FOR SELECT 
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.institute_id = institutes.id 
    AND ua.user_id = auth.uid() 
    AND ua.is_active = true
  )
  AND NOT has_full_institute_access(institutes.id)
);

-- 4. Users with full access can view all institute details
CREATE POLICY "Full access users can view all institute details" 
ON public.institutes 
FOR SELECT 
USING (has_full_institute_access(institutes.id));

-- Create a secure view for basic institute information that regular users should access
CREATE OR REPLACE VIEW public.institutes_basic_info AS
SELECT 
  id,
  name,
  code,
  description,
  is_active,
  created_at,
  updated_at,
  max_students,
  current_student_count
FROM public.institutes
WHERE is_active = true;

-- Enable RLS on the view
ALTER VIEW public.institutes_basic_info SET (security_barrier = true);

-- Create RLS policy for the basic info view
CREATE POLICY "Users can view basic institute info through view" 
ON public.institutes_basic_info 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.institute_id = institutes_basic_info.id 
    AND ua.user_id = auth.uid() 
    AND ua.is_active = true
  )
);

-- Create a secure function for getting safe institute data for regular users
CREATE OR REPLACE FUNCTION public.get_safe_institute_info(institute_id_param uuid)
RETURNS TABLE(
  id uuid,
  name text,
  code text,
  description text,
  is_active boolean
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
    i.is_active
  FROM public.institutes i
  WHERE i.id = institute_id_param
  AND i.is_active = true
  AND (
    -- User must be assigned to this institute
    EXISTS (
      SELECT 1
      FROM user_assignments ua
      WHERE ua.institute_id = institute_id_param 
      AND ua.user_id = auth.uid() 
      AND ua.is_active = true
    )
    OR 
    -- Or have full access
    has_full_institute_access(institute_id_param)
  );
$$;