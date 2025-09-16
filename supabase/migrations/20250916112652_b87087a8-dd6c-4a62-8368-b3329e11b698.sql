-- Fix the submit_assignment_direct function to properly update attempt status
DROP FUNCTION IF EXISTS public.submit_assignment_direct(uuid, uuid);

CREATE OR REPLACE FUNCTION public.submit_assignment_direct(p_assignment_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assignment_record RECORD;
  institute_admin_id UUID;
  attempt_id UUID;
BEGIN
  -- Get assignment details using fully qualified names and aliases
  SELECT ca.id, ca.title, cs.course_id, cc.title as course_title
  INTO assignment_record
  FROM public.clp_assignments ca
  JOIN public.course_sections cs ON ca.section_id = cs.id
  JOIN public.clp_courses cc ON cs.course_id = cc.id
  WHERE ca.id = p_assignment_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Find and update the user's current attempt
  UPDATE public.clp_attempts 
  SET 
    status = 'submitted',
    submitted_at = now(),
    updated_at = now()
  WHERE assignment_id = p_assignment_id 
    AND user_id = p_user_id 
    AND status = 'started'
  RETURNING id INTO attempt_id;
  
  -- If no attempt was found, return false
  IF attempt_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Find institute admin for this user using fully qualified names
  SELECT iaa.user_id INTO institute_admin_id
  FROM public.user_assignments ua
  JOIN public.institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
  WHERE ua.user_id = p_user_id
    AND ua.is_active = true
    AND iaa.is_active = true
  LIMIT 1;
  
  -- Create notification for institute admin if found
  IF institute_admin_id IS NOT NULL THEN
    INSERT INTO public.clp_notifications (user_id, assignment_id, type, payload)
    VALUES (
      institute_admin_id, 
      p_assignment_id,
      'assignment_submitted',
      jsonb_build_object(
        'student_id', p_user_id,
        'assignment_title', assignment_record.title,
        'course_title', assignment_record.course_title,
        'submitted_at', now()
      )
    );
  END IF;
  
  -- Also create an entry in assignment_submissions for backwards compatibility
  INSERT INTO public.assignment_submissions (assignment_id, user_id, status, submitted_at)
  VALUES (p_assignment_id, p_user_id, 'submitted', now())
  ON CONFLICT (assignment_id, user_id) 
  DO UPDATE SET 
    status = 'submitted',
    submitted_at = now();
    
  RETURN true;
END;
$function$;