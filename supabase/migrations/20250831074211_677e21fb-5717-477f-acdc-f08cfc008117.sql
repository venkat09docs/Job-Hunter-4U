-- Create the cron job to run the weekly GitHub assignments refresh
-- This will run every Monday at 12:00 AM (midnight) to refresh weekly assignments
-- Making sure assignments are available until Sunday 11:59 PM, then refresh on Monday 12:00 AM

SELECT cron.schedule(
  'weekly-github-assignments-refresh',
  '0 0 * * 1', -- Every Monday at 00:00 (midnight)
  $$
  SELECT net.http_post(
    url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/weekly-github-assignments-refresh',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3MTUzOCwiZXhwIjoyMDY5MTQ3NTM4fQ.d-rBm6zzLV4zPB4y4RsT8Z7fVuC4X3V91cXTJg58xZQ"}'::jsonb,
    body := '{"trigger": "cron_weekly_refresh"}'::jsonb
  ) AS request_id;
  $$
);