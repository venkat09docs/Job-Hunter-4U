-- Fix ambiguous column reference in update_leaderboard_for_attempt function
CREATE OR REPLACE FUNCTION public.update_leaderboard_for_attempt(attempt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_record RECORD;
  course_id UUID;
  module_id UUID;
BEGIN
  -- Get attempt details with explicit table aliases
  SELECT ca.user_id, ca.score_points, cm.id as mod_id, cc.id as crs_id
  INTO attempt_record
  FROM clp_attempts ca
  JOIN clp_assignments cas ON ca.assignment_id = cas.id
  JOIN course_sections cs ON cas.section_id = cs.id
  JOIN clp_courses cc ON cs.course_id = cc.id
  WHERE ca.id = attempt_id;
  
  IF FOUND THEN
    course_id := attempt_record.crs_id;
    module_id := attempt_record.mod_id;
    
    -- Update module leaderboard
    INSERT INTO clp_leaderboard (user_id, course_id, module_id, points_total)
    VALUES (attempt_record.user_id, course_id, module_id, attempt_record.score_points)
    ON CONFLICT (user_id, course_id, module_id)
    DO UPDATE SET 
      points_total = clp_leaderboard.points_total + attempt_record.score_points,
      last_updated_at = now();
    
    -- Update course leaderboard  
    INSERT INTO clp_leaderboard (user_id, course_id, module_id, points_total)
    VALUES (attempt_record.user_id, course_id, NULL, attempt_record.score_points)
    ON CONFLICT (user_id, course_id, module_id)
    DO UPDATE SET 
      points_total = clp_leaderboard.points_total + attempt_record.score_points,
      last_updated_at = now();
  END IF;
END;
$function$;