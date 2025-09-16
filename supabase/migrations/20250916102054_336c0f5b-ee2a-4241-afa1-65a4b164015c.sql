-- Fix the trigger function that references non-existent cas.module_id
-- The clp_assignments table has section_id, not module_id

-- Drop and recreate the trigger_auto_submit function with correct joins
DROP FUNCTION IF EXISTS public.trigger_auto_submit(uuid);

CREATE OR REPLACE FUNCTION public.trigger_auto_submit(attempt_id uuid)
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
    -- For now, set module_id to null since we don't have modules in this structure
    module_id := null;
    
    -- Update course leaderboard (without module_id for now)
    INSERT INTO clp_leaderboard (user_id, course_id, module_id, points_total)
    VALUES (attempt_record.user_id, course_id, module_id, COALESCE(attempt_record.score_points, 0))
    ON CONFLICT (user_id, course_id, module_id) 
    DO UPDATE SET 
      points_total = GREATEST(clp_leaderboard.points_total, EXCLUDED.points_total),
      last_updated_at = now();
  END IF;
END;
$function$;