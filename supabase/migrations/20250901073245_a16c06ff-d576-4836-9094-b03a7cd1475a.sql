-- Fix the trigger function that calls create_smart_notification with wrong parameter order
CREATE OR REPLACE FUNCTION public.notify_assignment_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  template_record record;
  total_points integer;
BEGIN
  -- Only notify when assignment is verified (completed)
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    
    -- Get total points for user
    SELECT COALESCE(SUM(points_earned), 0) INTO total_points
    FROM career_task_assignments 
    WHERE user_id = NEW.user_id AND status = 'verified';
    
    -- Get assignment title
    SELECT title INTO template_record
    FROM career_task_templates 
    WHERE id = NEW.template_id;
    
    -- Create assignment completion notification with CORRECT parameter order
    PERFORM create_smart_notification(
      NEW.user_id,
      'assignment_completed',
      json_build_object(
        'assignment_title', COALESCE(template_record.title, 'Assignment'),
        'points', NEW.points_earned,
        'related_id', NEW.id
      )::jsonb,
      '/career-assignments',
      'normal', -- priority_param (5th parameter)
      NULL      -- scheduled_for_param (6th parameter)
    );
    
    -- Create points milestone notification for certain milestones
    IF total_points IN (100, 250, 500, 1000, 2500, 5000) THEN
      PERFORM create_smart_notification(
        NEW.user_id,
        'points_milestone',
        json_build_object(
          'points', total_points,
          'related_id', NEW.user_id
        )::jsonb,
        '/leaderboard-points',
        'high', -- priority_param (5th parameter)
        NULL    -- scheduled_for_param (6th parameter)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;