-- Phase 1E: Create notification triggers for core modules (Fixed)

-- Trigger for new job postings (using 'jobs' table)
CREATE OR REPLACE FUNCTION notify_new_job_posted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Send notifications to eligible users (exclude admins/recruiters)
  INSERT INTO notifications (user_id, title, message, type, category, action_url, related_id, is_read)
  SELECT DISTINCT 
    ua.user_id,
    'New Job Posted',
    'A new job opportunity "' || NEW.title || '" at ' || NEW.company || ' has been posted!',
    'new_job_posted',
    'job_hunting',
    '/job-search',
    NEW.id::text,
    false
  FROM user_assignments ua
  LEFT JOIN user_roles ur ON ua.user_id = ur.user_id
  WHERE ua.is_active = true
    AND ua.user_id != NEW.posted_by -- Don't notify the poster
    AND should_send_notification(ua.user_id, 'new_job_posted') = true
    AND (ur.role IS NULL OR ur.role NOT IN ('institute_admin', 'recruiter'));

  RETURN NEW;
END;
$$;

-- Check if jobs table exists before creating trigger
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jobs') THEN
        -- Drop existing trigger if exists
        DROP TRIGGER IF EXISTS notify_job_posted ON jobs;
        -- Create new trigger
        CREATE TRIGGER notify_job_posted
          AFTER INSERT ON jobs
          FOR EACH ROW EXECUTE FUNCTION notify_new_job_posted();
    END IF;
END
$$;

-- Trigger for job tracker status changes (follow-up reminders)
CREATE OR REPLACE FUNCTION notify_job_tracker_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create follow-up reminder when job status changes to 'applied'
  IF NEW.status = 'applied' AND (OLD.status IS NULL OR OLD.status != 'applied') THEN
    PERFORM create_smart_notification(
      NEW.user_id,
      'follow_up_reminder',
      json_build_object(
        'job_title', NEW.title,
        'company', NEW.company,
        'related_id', NEW.id
      )::jsonb,
      '/job-tracker',
      (NEW.created_at + INTERVAL '3 days'), -- Schedule follow-up in 3 days
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for job tracker
DROP TRIGGER IF EXISTS notify_job_tracker_changes ON job_tracker;
CREATE TRIGGER notify_job_tracker_changes
  AFTER UPDATE ON job_tracker
  FOR EACH ROW EXECUTE FUNCTION notify_job_tracker_changes();

-- Trigger for assignment completions (points milestone)
CREATE OR REPLACE FUNCTION notify_assignment_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    
    -- Create assignment completion notification
    PERFORM create_smart_notification(
      NEW.user_id,
      'assignment_completed',
      json_build_object(
        'assignment_title', COALESCE(template_record.title, 'Assignment'),
        'points', NEW.points_earned,
        'related_id', NEW.id
      )::jsonb,
      '/career-assignments',
      NULL,
      'normal'
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
        NULL,
        'high'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for assignment completions
DROP TRIGGER IF EXISTS notify_assignment_completion ON career_task_assignments;
CREATE TRIGGER notify_assignment_completion
  AFTER UPDATE ON career_task_assignments
  FOR EACH ROW EXECUTE FUNCTION notify_assignment_completion();