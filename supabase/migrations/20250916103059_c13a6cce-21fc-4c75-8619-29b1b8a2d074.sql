-- Fix all remaining database functions that reference non-existent cas.module_id
-- First, let's check what triggers are on clp_attempts table and fix them

-- Drop any existing problematic triggers and functions
DROP TRIGGER IF EXISTS trigger_auto_grade ON clp_attempts;
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON clp_attempts;
DROP FUNCTION IF EXISTS public.trigger_auto_submit(uuid);
DROP FUNCTION IF EXISTS public.update_leaderboard_on_submission(uuid);

-- Recreate the trigger_auto_submit function with correct schema
CREATE OR REPLACE FUNCTION public.trigger_auto_submit(attempt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_record RECORD;
  course_id UUID;
BEGIN
  -- Get attempt details with correct joins
  -- clp_assignments has section_id, which links to course_sections, which has course_id
  SELECT ca.user_id, ca.score_points, cs.course_id as crs_id
  INTO attempt_record
  FROM clp_attempts ca
  JOIN clp_assignments cas ON ca.assignment_id = cas.id
  JOIN course_sections cs ON cas.section_id = cs.id
  WHERE ca.id = attempt_id;
  
  IF FOUND THEN
    course_id := attempt_record.crs_id;
    
    -- Update course leaderboard (without module_id since we don't use modules)
    INSERT INTO clp_leaderboard (user_id, course_id, module_id, points_total)
    VALUES (attempt_record.user_id, course_id, null, COALESCE(attempt_record.score_points, 0))
    ON CONFLICT (user_id, course_id, COALESCE(module_id, '00000000-0000-0000-0000-000000000000'::uuid)) 
    DO UPDATE SET 
      points_total = GREATEST(clp_leaderboard.points_total, EXCLUDED.points_total),
      last_updated_at = now();
  END IF;
END;
$function$;

-- Create a simpler submission trigger that doesn't cause conflicts
CREATE OR REPLACE FUNCTION public.handle_clp_attempt_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger when status changes to 'submitted'
  IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status != 'submitted') THEN
    -- Call auto grading
    PERFORM public.auto_grade_attempt(NEW.id);
    
    -- Update leaderboard
    PERFORM public.trigger_auto_submit(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER trigger_handle_clp_submission
  AFTER UPDATE ON clp_attempts
  FOR EACH ROW
  EXECUTE FUNCTION handle_clp_attempt_submission();