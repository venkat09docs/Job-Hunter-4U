-- Phase 2: GitHub/LinkedIn and AI Tools Notifications

-- Add notification templates for GitHub/LinkedIn activities
INSERT INTO notification_templates (code, title, message_template, category, priority, variables, is_active) VALUES
-- GitHub notifications
('github_weekly_completed', 'GitHub Weekly Complete! 🎉', 'Amazing work! You completed all GitHub tasks this week and earned {{points_earned}} points. Keep building!', 'achievement', 'medium', '["points_earned"]', true),
('github_streak_milestone', 'GitHub Streak Milestone! 🔥', 'Incredible! You have maintained a {{streak_days}}-day GitHub contribution streak. You are on fire!', 'achievement', 'high', '["streak_days"]', true),
('github_task_reminder', 'GitHub Task Due Soon ⏰', 'Your GitHub task "{{task_title}}" is due in {{hours_remaining}} hours. Don''t miss out on those points!', 'reminder', 'medium', '["task_title", "hours_remaining"]', true),
('github_pr_merged', 'Pull Request Merged! 🚀', 'Congratulations! Your pull request "{{pr_title}}" has been merged. Great collaboration!', 'achievement', 'medium', '["pr_title"]', true),
('github_repo_milestone', 'Repository Milestone! ⭐', 'Your repository "{{repo_name}}" just reached {{milestone_type}}! Keep building amazing projects.', 'achievement', 'medium', '["repo_name", "milestone_type"]', true),

-- LinkedIn notifications  
('linkedin_weekly_completed', 'LinkedIn Weekly Complete! 🎯', 'Excellent networking! You completed all LinkedIn tasks this week and earned {{points_earned}} points.', 'achievement', 'medium', '["points_earned"]', true),
('linkedin_connection_milestone', 'LinkedIn Connection Milestone! 🤝', 'Fantastic networking! You have reached {{connection_count}} connections. Your network is growing strong!', 'achievement', 'medium', '["connection_count"]', true),
('linkedin_task_reminder', 'LinkedIn Task Due Soon 📱', 'Your LinkedIn task "{{task_title}}" is due in {{hours_remaining}} hours. Keep networking!', 'reminder', 'medium', '["task_title", "hours_remaining"]', true),
('linkedin_post_engagement', 'Great LinkedIn Engagement! 👍', 'Your recent LinkedIn post got {{engagement_count}} {{engagement_type}}! Your content is resonating well.', 'achievement', 'low', '["engagement_count", "engagement_type"]', true),

-- AI Tools notifications
('ai_tool_used', 'AI Tool Used Successfully! 🤖', 'You successfully used {{tool_name}}! {{credits_remaining}} credits remaining.', 'info', 'low', '["tool_name", "credits_remaining"]', true),
('ai_credits_low', 'AI Credits Running Low! ⚡', 'You have only {{credits_remaining}} AI credits left. Consider upgrading your plan to continue using AI tools.', 'warning', 'high', '["credits_remaining"]', true),
('ai_monthly_summary', 'Monthly AI Usage Summary 📊', 'This month you used {{tools_count}} different AI tools {{usage_count}} times. Your favorite tool was {{favorite_tool}}.', 'info', 'low', '["tools_count", "usage_count", "favorite_tool"]', true),
('ai_new_tool_available', 'New AI Tool Available! ✨', 'A new AI tool "{{tool_name}}" is now available! {{tool_description}}', 'info', 'medium', '["tool_name", "tool_description"]', true);

-- Create triggers for GitHub progress updates
CREATE OR REPLACE FUNCTION notify_github_weekly_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  points_earned INTEGER;
BEGIN
  -- Count total and completed GitHub tasks for this week
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'VERIFIED')
  INTO total_tasks, completed_tasks
  FROM github_user_tasks
  WHERE user_id = NEW.user_id 
  AND period = NEW.period;
  
  -- Get points earned this week
  SELECT COALESCE(SUM(score_awarded), 0)
  INTO points_earned
  FROM github_user_tasks
  WHERE user_id = NEW.user_id 
  AND period = NEW.period
  AND status = 'VERIFIED';
  
  -- If all tasks completed, send celebration notification
  IF completed_tasks = total_tasks AND total_tasks > 0 AND NEW.status = 'VERIFIED' THEN
    INSERT INTO notifications (user_id, template_code, template_variables, scheduled_for)
    VALUES (
      NEW.user_id,
      'github_weekly_completed',
      jsonb_build_object('points_earned', points_earned),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER github_weekly_completion_trigger
  AFTER UPDATE ON github_user_tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'VERIFIED')
  EXECUTE FUNCTION notify_github_weekly_completion();

-- Create triggers for LinkedIn progress updates  
CREATE OR REPLACE FUNCTION notify_linkedin_weekly_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  points_earned INTEGER;
BEGIN
  -- Count total and completed LinkedIn tasks for this week
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
  INTO total_tasks, completed_tasks
  FROM linkedin_user_tasks
  WHERE user_id = NEW.user_id 
  AND week_start_date = NEW.week_start_date;
  
  -- Calculate points (assuming 10 points per task)
  points_earned := completed_tasks * 10;
  
  -- If all tasks completed, send celebration notification
  IF completed_tasks = total_tasks AND total_tasks > 0 AND NEW.completed = true THEN
    INSERT INTO notifications (user_id, template_code, template_variables, scheduled_for)
    VALUES (
      NEW.user_id,
      'linkedin_weekly_completed',
      jsonb_build_object('points_earned', points_earned),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER linkedin_weekly_completion_trigger
  AFTER UPDATE ON linkedin_user_tasks
  FOR EACH ROW
  WHEN (OLD.completed IS DISTINCT FROM NEW.completed AND NEW.completed = true)
  EXECUTE FUNCTION notify_linkedin_weekly_completion();

-- Create triggers for AI tool usage
CREATE OR REPLACE FUNCTION notify_ai_tool_usage()
RETURNS TRIGGER AS $$
DECLARE
  tool_name TEXT;
  remaining_credits INTEGER;
BEGIN
  -- Get tool name
  SELECT at.tool_name INTO tool_name
  FROM ai_tools at
  WHERE at.id = NEW.tool_id;
  
  -- For now, assume unlimited credits (can be enhanced later)
  remaining_credits := 999;
  
  -- Send tool usage notification
  INSERT INTO notifications (user_id, template_code, template_variables, scheduled_for)
  VALUES (
    NEW.user_id,
    'ai_tool_used',
    jsonb_build_object('tool_name', tool_name, 'credits_remaining', remaining_credits),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tool usage (assuming there's a tool_usage table)
-- Note: This will be created when tool usage tracking is implemented
-- CREATE OR REPLACE TRIGGER ai_tool_usage_trigger
--   AFTER INSERT ON tool_usage
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_ai_tool_usage();

-- Create function for GitHub task reminders
CREATE OR REPLACE FUNCTION send_github_task_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Send reminders for GitHub tasks due within 24 hours
  INSERT INTO notifications (user_id, template_code, template_variables, scheduled_for)
  SELECT 
    gut.user_id,
    'github_task_reminder',
    jsonb_build_object(
      'task_title', gt.title,
      'hours_remaining', EXTRACT(EPOCH FROM (gut.due_at - NOW())) / 3600
    ),
    NOW()
  FROM github_user_tasks gut
  JOIN github_tasks gt ON gut.task_id = gt.id
  WHERE gut.status = 'NOT_STARTED'
    AND gut.due_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
    AND should_send_notification(gut.user_id, 'github_task_reminder') = true
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = gut.user_id 
        AND n.template_code = 'github_task_reminder'
        AND n.template_variables->>'task_title' = gt.title
        AND n.created_at > NOW() - INTERVAL '24 hours'
    );
END;
$$;

-- Create function for LinkedIn task reminders
CREATE OR REPLACE FUNCTION send_linkedin_task_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Send reminders for LinkedIn tasks due within 24 hours
  INSERT INTO notifications (user_id, template_code, template_variables, scheduled_for)
  SELECT 
    lut.user_id,
    'linkedin_task_reminder',
    jsonb_build_object(
      'task_title', lt.title,
      'hours_remaining', EXTRACT(EPOCH FROM (lut.due_at - NOW())) / 3600
    ),
    NOW()
  FROM linkedin_user_tasks lut
  JOIN linkedin_tasks lt ON lut.task_id = lt.id
  WHERE lut.completed = false
    AND lut.due_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
    AND should_send_notification(lut.user_id, 'linkedin_task_reminder') = true
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = lut.user_id 
        AND n.template_code = 'linkedin_task_reminder'
        AND n.template_variables->>'task_title' = lt.title
        AND n.created_at > NOW() - INTERVAL '24 hours'
    );
END;
$$;

-- Create function for connection milestones
CREATE OR REPLACE FUNCTION check_linkedin_connection_milestones()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Send milestone notifications for LinkedIn connections
  INSERT INTO notifications (user_id, template_code, template_variables, scheduled_for)
  SELECT 
    lnm.user_id,
    'linkedin_connection_milestone',
    jsonb_build_object('connection_count', lnm.value),
    NOW()
  FROM linkedin_network_metrics lnm
  WHERE lnm.activity_id = 'connections'
    AND lnm.value IN (50, 100, 250, 500, 1000) -- Milestone values
    AND lnm.updated_at > NOW() - INTERVAL '1 hour' -- Recent updates
    AND should_send_notification(lnm.user_id, 'linkedin_connection_milestone') = true
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = lnm.user_id 
        AND n.template_code = 'linkedin_connection_milestone'
        AND n.template_variables->>'connection_count' = lnm.value::text
        AND n.created_at > NOW() - INTERVAL '7 days'
    );
END;
$$;