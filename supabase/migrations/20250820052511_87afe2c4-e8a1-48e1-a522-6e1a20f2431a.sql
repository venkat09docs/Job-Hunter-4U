-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule profile completion reminders (daily at 9 AM)
SELECT cron.schedule(
  'profile-completion-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw"}'::jsonb,
    body := '{"task": "profile_completion_reminders"}'::jsonb
  );
  $$
);

-- Schedule learning goal reminders (daily at 10 AM)
SELECT cron.schedule(
  'learning-goal-reminders',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw"}'::jsonb,
    body := '{"task": "learning_goal_reminders"}'::jsonb
  );
  $$
);

-- Schedule weekly progress summaries (Mondays at 8 AM)
SELECT cron.schedule(
  'weekly-progress-summaries',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw"}'::jsonb,
    body := '{"task": "weekly_progress_summaries"}'::jsonb
  );
  $$
);

-- Schedule job application reminders (every 3 days at 2 PM)
SELECT cron.schedule(
  'job-application-reminders',
  '0 14 */3 * *',
  $$
  SELECT net.http_post(
    url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw"}'::jsonb,
    body := '{"task": "job_application_reminders"}'::jsonb
  );
  $$
);