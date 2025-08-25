-- Create a more secure solution for institute data access
-- First, remove the current policy that still allows too much access
DROP POLICY IF EXISTS "Regular users basic institute access only" ON public.institutes;

-- Create a security definer function that returns only safe institute data for regular users
CREATE OR REPLACE FUNCTION public.get_safe_institute_data_for_user()
RETURNS TABLE(
  id uuid,
  name text,
  code text, 
  description text,
  is_active boolean
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
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
    )
    AND NOT has_role(auth.uid(), 'admin'::app_role)
    AND NOT has_role(auth.uid(), 'institute_admin'::app_role);
$$;

-- Now create a very restrictive policy that blocks regular users from direct table access
-- They must use the security functions instead
CREATE POLICY "Block direct institute access for regular users" 
  ON public.institutes 
  FOR SELECT 
  TO authenticated
  USING (
    -- Only allow direct table access for admins and institute admins
    has_role(auth.uid(), 'admin'::app_role) 
    OR (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1 
        FROM institute_admin_assignments iaa 
        WHERE iaa.user_id = auth.uid() 
          AND iaa.institute_id = institutes.id 
          AND iaa.is_active = true
      )
    )
  );