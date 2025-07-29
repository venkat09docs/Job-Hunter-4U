-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.get_user_assignments(user_id_param UUID)
RETURNS TABLE (
  institute_id UUID,
  institute_name TEXT,
  institute_code TEXT,
  batch_id UUID,
  batch_name TEXT,
  batch_code TEXT,
  assignment_type TEXT
) 
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ua.institute_id,
    i.name as institute_name,
    i.code as institute_code,
    ua.batch_id,
    b.name as batch_name,
    b.code as batch_code,
    ua.assignment_type
  FROM public.user_assignments ua
  LEFT JOIN public.institutes i ON ua.institute_id = i.id
  LEFT JOIN public.batches b ON ua.batch_id = b.id
  WHERE ua.user_id = user_id_param 
    AND ua.is_active = true
    AND (i.is_active = true OR i.is_active IS NULL)
    AND (b.is_active = true OR b.is_active IS NULL);
$$;