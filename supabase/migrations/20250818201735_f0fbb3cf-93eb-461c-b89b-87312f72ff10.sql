-- First, drop all existing policies on institutes table to start fresh
DROP POLICY IF EXISTS "Assigned users can view basic institute info only" ON public.institutes;
DROP POLICY IF EXISTS "Full access users can view all institute details" ON public.institutes;
DROP POLICY IF EXISTS "Institute admins can manage their institutes" ON public.institutes;
DROP POLICY IF EXISTS "Super admins can manage all institutes" ON public.institutes;
DROP POLICY IF EXISTS "Assigned users can view safe institute info only" ON public.institutes;

-- Create a function to return only safe institute information for regular users
CREATE OR REPLACE FUNCTION public.get_safe_institute_info_for_users()
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
  WHERE i.is_active = true
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.institute_id = i.id 
    AND ua.user_id = auth.uid() 
    AND ua.is_active = true
  );
$$;

-- Recreate secure RLS policies
-- Policy 1: Super admins can manage all institutes
CREATE POLICY "Super admins can manage all institutes" 
ON public.institutes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy 2: Institute admins can manage their assigned institutes (including sensitive data)
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

-- Policy 3: Regular assigned users can only see non-sensitive institute info
-- This policy restricts access but doesn't prevent column access - we'll handle that with views
CREATE POLICY "Assigned users restricted access" 
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
  AND NOT has_role(auth.uid(), 'admin'::app_role)
  AND NOT has_role(auth.uid(), 'institute_admin'::app_role)
);

-- Create a secure view that excludes sensitive contact information for regular users
CREATE OR REPLACE VIEW public.institutes_public_view AS
SELECT 
  id,
  name,
  code,
  description,
  is_active,
  created_at,
  updated_at,
  subscription_plan,
  subscription_active,
  subscription_start_date,
  subscription_end_date,
  max_students,
  current_student_count
FROM public.institutes
WHERE is_active = true
AND EXISTS (
  SELECT 1
  FROM user_assignments ua
  WHERE ua.institute_id = institutes.id 
  AND ua.user_id = auth.uid() 
  AND ua.is_active = true
);

-- Grant SELECT permission on the public view
GRANT SELECT ON public.institutes_public_view TO authenticated;

-- Update existing functions to be more restrictive
CREATE OR REPLACE FUNCTION public.get_safe_institute_info(institute_id_param uuid)
RETURNS TABLE(id uuid, name text, code text, description text, is_active boolean)
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
    -- User must be assigned to this institute OR have admin access
    EXISTS (
      SELECT 1
      FROM user_assignments ua
      WHERE ua.institute_id = institute_id_param 
      AND ua.user_id = auth.uid() 
      AND ua.is_active = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (
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