-- Remove all attempt-related triggers and functions since attempts are not used
-- This system uses direct assignment submission to institute admin

-- Drop all attempt-related triggers and functions
DROP TRIGGER IF EXISTS trigger_handle_clp_submission ON clp_attempts;
DROP TRIGGER IF EXISTS trigger_auto_grade ON clp_attempts;  
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON clp_attempts;
DROP FUNCTION IF EXISTS public.handle_clp_attempt_submission();
DROP FUNCTION IF EXISTS public.trigger_auto_submit(uuid);
DROP FUNCTION IF EXISTS public.update_leaderboard_on_submission(uuid);
DROP FUNCTION IF EXISTS public.auto_grade_attempt(uuid);

-- Create a simple direct assignment submission function
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
  
  -- Find institute admin for this user
  SELECT iaa.user_id INTO institute_admin_id
  FROM user_assignments ua
  JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
  WHERE ua.user_id = user_id
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
        'student_id', user_id,
        'assignment_title', assignment_record.title,
        'course_title', assignment_record.course_title,
        'submitted_at', now()
      )
    );
  END IF;
  
  -- Update assignment submission status in a simple submissions table
  INSERT INTO assignment_submissions (assignment_id, user_id, status, submitted_at)
  VALUES (assignment_id, user_id, 'submitted', now())
  ON CONFLICT (assignment_id, user_id) 
  DO UPDATE SET 
    status = 'submitted',
    submitted_at = now();
    
  RETURN true;
END;
$function$;

-- Create simple assignment submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES clp_assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewer_id uuid,
  score integer DEFAULT 0,
  feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(assignment_id, user_id)
);

-- Enable RLS on assignment_submissions table
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment_submissions
CREATE POLICY "Users can view their own submissions" ON assignment_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions" ON assignment_submissions  
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" ON assignment_submissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all submissions" ON assignment_submissions
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'institute_admin'::app_role) OR 
    has_role(auth.uid(), 'recruiter'::app_role)
  );