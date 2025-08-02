-- Enable pg_cron and pg_net extensions for scheduled functions
SELECT cron.schedule(
  'weekly-progress-capture',
  '0 0 * * 6',  -- Every Saturday at midnight
  $$
  select
    net.http_post(
        url:='https://moirryvajzyriagqihbe.supabase.co/functions/v1/weekly-progress-capture',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);