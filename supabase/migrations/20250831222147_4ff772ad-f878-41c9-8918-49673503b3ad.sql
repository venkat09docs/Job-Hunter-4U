-- Phase 1E: Create notification triggers for core modules

-- Trigger for new job postings
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

-- Replace existing job posting trigger
DROP TRIGGER IF EXISTS notify_job_posted ON internal_jobs;
CREATE TRIGGER notify_job_posted
  AFTER INSERT ON internal_jobs
  FOR EACH ROW EXECUTE FUNCTION notify_new_job_posted();

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

-- Trigger for GitHub milestones
CREATE OR REPLACE FUNCTION notify_github_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  completed_tasks integer;
BEGIN
  -- Count completed GitHub tasks for user
  SELECT COUNT(*) INTO completed_tasks
  FROM github_progress 
  WHERE user_id = NEW.user_id AND completed = true;
  
  -- Notify on certain milestones
  IF completed_tasks IN (1, 5, 10, 25, 50) THEN
    PERFORM create_smart_notification(
      NEW.user_id,
      'github_streak_achieved',
      json_build_object(
        'days', completed_tasks,
        'related_id', NEW.user_id
      )::jsonb,
      '/github-weekly',
      NULL,
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for GitHub progress
DROP TRIGGER IF EXISTS notify_github_milestones ON github_progress;
CREATE TRIGGER notify_github_milestones
  AFTER UPDATE ON github_progress
  FOR EACH ROW 
  WHEN (NEW.completed = true AND OLD.completed = false)
  EXECUTE FUNCTION notify_github_milestones();

-- Trigger for LinkedIn network milestones
CREATE OR REPLACE FUNCTION notify_linkedin_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  connections_count integer;
BEGIN
  -- Get connections count
  connections_count := NEW.value;
  
  -- Notify on connection milestones (every 50 connections)
  IF NEW.activity_id = 'connections' AND connections_count % 50 = 0 AND connections_count > 0 THEN
    PERFORM create_smart_notification(
      NEW.user_id,
      'linkedin_milestone',
      json_build_object(
        'connections', connections_count,
        'related_id', NEW.user_id
      )::jsonb,
      '/linkedin-optimization',
      NULL,
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for LinkedIn network metrics
DROP TRIGGER IF EXISTS notify_linkedin_milestones ON linkedin_network_metrics;
CREATE TRIGGER notify_linkedin_milestones
  AFTER INSERT OR UPDATE ON linkedin_network_metrics
  FOR EACH ROW EXECUTE FUNCTION notify_linkedin_milestones();