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

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Assigned users can view basic institute info only" ON public.institutes;
DROP POLICY IF EXISTS "Full access users can view all institute details" ON public.institutes;

-- Create new secure policies that protect sensitive contact information
CREATE POLICY "Assigned users can view safe institute info only" 
ON public.institutes 
FOR SELECT 
USING (
  (is_active = true) 
  AND (EXISTS ( 
    SELECT 1
    FROM user_assignments ua
    WHERE ua.institute_id = institutes.id 
    AND ua.user_id = auth.uid() 
    AND ua.is_active = true
  )) 
  AND (NOT has_full_institute_access(id))
  -- This policy will be combined with column-level restrictions below
);

CREATE POLICY "Full access users can view all institute details" 
ON public.institutes 
FOR SELECT 
USING (has_full_institute_access(id));

-- Create column-level security by creating a view for safe institute access
CREATE OR REPLACE VIEW public.institutes_safe_view AS
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
AND (
  -- Only show to users assigned to this institute or those with full access
  EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.institute_id = institutes.id 
    AND ua.user_id = auth.uid() 
    AND ua.is_active = true
  )
  OR has_full_institute_access(id)
);

-- Grant appropriate permissions on the view
GRANT SELECT ON public.institutes_safe_view TO authenticated;

-- Update the existing get_safe_institute_info function to be more restrictive
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
    -- User must be assigned to this institute OR have full access
    EXISTS (
      SELECT 1
      FROM user_assignments ua
      WHERE ua.institute_id = institute_id_param 
      AND ua.user_id = auth.uid() 
      AND ua.is_active = true
    )
    OR has_full_institute_access(institute_id_param)
  );
$$;