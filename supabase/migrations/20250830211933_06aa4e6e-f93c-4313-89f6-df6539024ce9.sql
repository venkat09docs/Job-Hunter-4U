-- Create cron job to send Level Up daily reminders at 8 AM
SELECT cron.schedule(
  'level-up-daily-reminders',
  '0 8 * * *', -- Every day at 8:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://moirryvajzyriagqihbe.supabase.co/functions/v1/level-up-daily-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3MTUzOCwiZXhwIjoyMDY5MTQ3NTM4fQ.d-rBm6zzLV4zPB4y4RsT8Z7fVuC4X3V91cXTJg58xZQ"}'::jsonb,
        body:='{"trigger": "daily_cron"}'::jsonb
    ) as request_id;
  $$
);