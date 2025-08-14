-- Add student count tracking to institutes table
ALTER TABLE public.institutes 
ADD COLUMN max_students INTEGER,
ADD COLUMN current_student_count INTEGER DEFAULT 0;

-- Create function to get student count for an institute
CREATE OR REPLACE FUNCTION public.get_institute_student_count(institute_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(COUNT(ua.user_id), 0)::integer
  FROM public.user_assignments ua
  WHERE ua.institute_id = institute_id_param 
    AND ua.is_active = true
    AND ua.assignment_type = 'student';
$function$;

-- Create function to update institute student count
CREATE OR REPLACE FUNCTION public.update_institute_student_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Update current student count for the affected institute
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.institutes
    SET current_student_count = get_institute_student_count(NEW.institute_id)
    WHERE id = NEW.institute_id;
  END IF;
  
  -- Also update for OLD institute if this was an update that changed institute_id
  IF TG_OP = 'UPDATE' AND OLD.institute_id != NEW.institute_id THEN
    UPDATE public.institutes
    SET current_student_count = get_institute_student_count(OLD.institute_id)
    WHERE id = OLD.institute_id;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    UPDATE public.institutes
    SET current_student_count = get_institute_student_count(OLD.institute_id)
    WHERE id = OLD.institute_id;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically update student counts
CREATE TRIGGER update_institute_student_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_institute_student_count();

-- Set max_students based on subscription plan for existing institutes
UPDATE public.institutes 
SET max_students = CASE 
  WHEN subscription_plan = '50 Members Pack' THEN 50
  WHEN subscription_plan = '100 Members Pack' THEN 100
  WHEN subscription_plan = '200 Members Pack' THEN 200
  WHEN subscription_plan = '500 Members Pack' THEN 500
  ELSE NULL
END;

-- Update current student counts for all institutes
UPDATE public.institutes 
SET current_student_count = get_institute_student_count(id);