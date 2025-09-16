-- Fix the update_leaderboard_for_attempt function with correct ON CONFLICT constraint
CREATE OR REPLACE FUNCTION public.update_leaderboard_for_attempt(attempt_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_id_var UUID;
  course_id_var UUID;
  points_earned INTEGER := 0;
BEGIN
  -- Get user and course info from the attempt
  SELECT ca.user_id, cs.course_id, ca.score_points
  INTO user_id_var, course_id_var, points_earned
  FROM clp_attempts ca
  JOIN clp_assignments cass ON ca.assignment_id = cass.id
  JOIN course_sections cs ON cass.section_id = cs.id
  WHERE ca.id = attempt_id_param;
  
  IF user_id_var IS NULL THEN
    RETURN;
  END IF;
  
  -- Update or insert leaderboard entry with proper constraint (including module_id as NULL)
  INSERT INTO clp_leaderboard (user_id, course_id, module_id, points_total, last_updated_at)
  VALUES (user_id_var, course_id_var, NULL, points_earned, now())
  ON CONFLICT (user_id, course_id, module_id)
  DO UPDATE SET
    points_total = clp_leaderboard.points_total + points_earned,
    last_updated_at = now();
    
  RAISE LOG 'Updated leaderboard for user % in course % with % points', 
    user_id_var, course_id_var, points_earned;
END;
$function$;