-- Update the badge awarding function to match new Gold badge logic
-- Gold badge should now depend on Digital Profile tasks, not automatic RESUME completion
CREATE OR REPLACE FUNCTION public.award_profile_badges_for_user(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  completed_resume_tasks INTEGER;
  bronze_badge_id UUID;
  silver_badge_id UUID;
  gold_badge_id UUID;
BEGIN
  -- Count completed RESUME tasks for the user
  SELECT COUNT(*)
  INTO completed_resume_tasks
  FROM career_task_assignments cta
  JOIN career_task_templates ctt ON cta.template_id = ctt.id
  WHERE cta.user_id = user_uuid 
    AND cta.status = 'verified'
    AND ctt.module = 'RESUME'
    AND ctt.is_active = true;

  -- Get badge IDs
  SELECT id INTO bronze_badge_id FROM profile_badges WHERE code = 'profile_rookie';
  SELECT id INTO silver_badge_id FROM profile_badges WHERE code = 'profile_complete';
  SELECT id INTO gold_badge_id FROM profile_badges WHERE code = 'profile_perfectionist';

  -- Award Bronze badge (Profile Rookie) - for completing first task
  IF completed_resume_tasks >= 1 AND bronze_badge_id IS NOT NULL THEN
    INSERT INTO profile_user_badges (user_id, badge_id, progress_data)
    VALUES (user_uuid, bronze_badge_id, jsonb_build_object('completed_tasks', completed_resume_tasks))
    ON CONFLICT (user_id, badge_id) DO UPDATE SET
      progress_data = jsonb_build_object('completed_tasks', completed_resume_tasks),
      awarded_at = now();
  END IF;

  -- Award Silver badge (Profile Complete) - for completing all 9 resume tasks
  IF completed_resume_tasks >= 9 AND silver_badge_id IS NOT NULL THEN
    INSERT INTO profile_user_badges (user_id, badge_id, progress_data)
    VALUES (user_uuid, silver_badge_id, jsonb_build_object('completed_tasks', completed_resume_tasks))
    ON CONFLICT (user_id, badge_id) DO UPDATE SET
      progress_data = jsonb_build_object('completed_tasks', completed_resume_tasks),
      awarded_at = now();
  END IF;

  -- REMOVED: Gold badge auto-awarding based on RESUME tasks
  -- Gold badge now depends on Digital Profile tasks and must be manually awarded
  -- based on the new logic in the Level Up page
END;
$function$;