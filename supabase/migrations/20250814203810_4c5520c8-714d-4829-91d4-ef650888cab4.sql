-- First, let's manually update the current student counts for all institutes
UPDATE public.institutes 
SET current_student_count = (
  SELECT COUNT(*)
  FROM public.user_assignments ua
  WHERE ua.institute_id = institutes.id 
    AND ua.assignment_type = 'student' 
    AND ua.is_active = true
);

-- Also ensure the trigger is working correctly by recreating it
DROP TRIGGER IF EXISTS update_institute_student_count_trigger ON public.user_assignments;

CREATE TRIGGER update_institute_student_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_institute_student_count();