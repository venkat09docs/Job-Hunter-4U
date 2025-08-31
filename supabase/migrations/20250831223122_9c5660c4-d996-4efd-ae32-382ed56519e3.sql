-- Create proper notification templates table if needed and implement Phase 2

-- Create table if it doesn't exist with proper structure
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  message_template TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2: GitHub/LinkedIn and AI Tools Notifications
INSERT INTO notification_templates (code, title, message_template, category, priority, variables, is_active) VALUES
-- GitHub notifications
('github_weekly_completed', 'GitHub Weekly Complete! 🎉', 'Amazing work! You completed all GitHub tasks this week and earned {{points_earned}} points. Keep building!', 'technical', 'medium', '["points_earned"]', true),
('github_streak_milestone', 'GitHub Streak Milestone! 🔥', 'Incredible! You have maintained a {{streak_days}}-day GitHub contribution streak. You are on fire!', 'technical', 'high', '["streak_days"]', true),
('github_task_reminder', 'GitHub Task Due Soon ⏰', 'Your GitHub task "{{task_title}}" is due in {{hours_remaining}} hours. Don''t miss out on those points!', 'technical', 'medium', '["task_title", "hours_remaining"]', true),
('github_pr_merged', 'Pull Request Merged! 🚀', 'Congratulations! Your pull request "{{pr_title}}" has been merged. Great collaboration!', 'technical', 'medium', '["pr_title"]', true),
('github_repo_milestone', 'Repository Milestone! ⭐', 'Your repository "{{repo_name}}" just reached {{milestone_type}}! Keep building amazing projects.', 'technical', 'medium', '["repo_name", "milestone_type"]', true),

-- LinkedIn notifications  
('linkedin_weekly_completed', 'LinkedIn Weekly Complete! 🎯', 'Excellent networking! You completed all LinkedIn tasks this week and earned {{points_earned}} points.', 'networking', 'medium', '["points_earned"]', true),
('linkedin_connection_milestone', 'LinkedIn Connection Milestone! 🤝', 'Fantastic networking! You have reached {{connection_count}} connections. Your network is growing strong!', 'networking', 'medium', '["connection_count"]', true),
('linkedin_task_reminder', 'LinkedIn Task Due Soon 📱', 'Your LinkedIn task "{{task_title}}" is due in {{hours_remaining}} hours. Keep networking!', 'networking', 'medium', '["task_title", "hours_remaining"]', true),
('linkedin_post_engagement', 'Great LinkedIn Engagement! 👍', 'Your recent LinkedIn post got {{engagement_count}} {{engagement_type}}! Your content is resonating well.', 'networking', 'low', '["engagement_count", "engagement_type"]', true),

-- AI Tools notifications
('ai_tool_used', 'AI Tool Used Successfully! 🤖', 'You successfully used {{tool_name}}! {{credits_remaining}} credits remaining.', 'technical', 'low', '["tool_name", "credits_remaining"]', true),
('ai_credits_low', 'AI Credits Running Low! ⚡', 'You have only {{credits_remaining}} AI credits left. Consider upgrading your plan to continue using AI tools.', 'subscription', 'high', '["credits_remaining"]', true),
('ai_monthly_summary', 'Monthly AI Usage Summary 📊', 'This month you used {{tools_count}} different AI tools {{usage_count}} times. Your favorite tool was {{favorite_tool}}.', 'technical', 'low', '["tools_count", "usage_count", "favorite_tool"]', true),
('ai_new_tool_available', 'New AI Tool Available! ✨', 'A new AI tool "{{tool_name}}" is now available! {{tool_description}}', 'technical', 'medium', '["tool_name", "tool_description"]', true)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  message_template = EXCLUDED.message_template,
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active;

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