-- Fix the ambiguous user_id column reference in submit_assignment_direct function
CREATE OR REPLACE FUNCTION public.submit_assignment_direct(assignment_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assignment_record RECORD;
  institute_admin_id UUID;
BEGIN
  -- Get assignment details
  SELECT ca.id, ca.title, cs.course_id, cc.title as course_title
  INTO assignment_record
  FROM clp_assignments ca
  JOIN course_sections cs ON ca.section_id = cs.id
  JOIN clp_courses cc ON cs.course_id = cc.id
  WHERE ca.id = assignment_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Find institute admin for this user (fixed ambiguous column reference)
  SELECT iaa.user_id INTO institute_admin_id
  FROM user_assignments ua
  JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
  WHERE ua.user_id = $2  -- Use parameter position instead of name
    AND ua.is_active = true
    AND iaa.is_active = true
  LIMIT 1;
  
  -- Create notification for institute admin if found
  IF institute_admin_id IS NOT NULL THEN
    INSERT INTO clp_notifications (user_id, assignment_id, type, payload)
    VALUES (
      institute_admin_id, 
      assignment_id, 
      'assignment_submitted',
      jsonb_build_object(
        'student_id', $2,  -- Use parameter position
        'assignment_title', assignment_record.title,
        'course_title', assignment_record.course_title,
        'submitted_at', now()
      )
    );
  END IF;
  
  -- Update assignment submission status in a simple submissions table
  INSERT INTO assignment_submissions (assignment_id, user_id, status, submitted_at)
  VALUES (assignment_id, $2, 'submitted', now())  -- Use parameter position
  ON CONFLICT (assignment_id, user_id) 
  DO UPDATE SET 
    status = 'submitted',
    submitted_at = now();
    
  RETURN true;
END;
$function$;