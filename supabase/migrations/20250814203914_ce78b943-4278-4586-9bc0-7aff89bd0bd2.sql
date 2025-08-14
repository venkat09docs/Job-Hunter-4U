-- Update the function to count students correctly (they have assignment_type 'batch')
CREATE OR REPLACE FUNCTION public.get_institute_student_count(institute_id_param uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(COUNT(ua.user_id), 0)::integer
  FROM public.user_assignments ua
  WHERE ua.institute_id = institute_id_param 
    AND ua.assignment_type = 'batch'  -- Changed from 'student' to 'batch'
    AND ua.is_active = true;
$function$;

-- Now update all institutes with correct student counts
UPDATE public.institutes 
SET current_student_count = (
  SELECT COUNT(*)
  FROM public.user_assignments ua
  WHERE ua.institute_id = institutes.id 
    AND ua.assignment_type = 'batch'  -- Changed from 'student' to 'batch'
    AND ua.is_active = true
);