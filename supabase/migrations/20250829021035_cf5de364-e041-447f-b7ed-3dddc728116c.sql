-- Enable the required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to refresh GitHub weekly assignments every Monday at 00:00 UTC
SELECT cron.schedule(
  'refresh-github-weekly-assignments',
  '0 0 * * 1', -- Every Monday at midnight UTC
  $$
  SELECT
    net.http_post(
        url:='https://moirryvajzyriagqihbe.supabase.co/functions/v1/weekly-github-assignments-refresh',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3MTUzOCwiZXhwIjoyMDY5MTQ3NTM4fQ.d-rBm6zzLV4zPB4y4RsT8Z7fVuC4X3V91cXTJg58xZQ"}'::jsonb,
        body:=concat('{"trigger": "cron", "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Optional: Create a function to manually trigger the refresh (useful for testing)
CREATE OR REPLACE FUNCTION refresh_github_weekly_assignments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT net.http_post(
    url:='https://moirryvajzyriagqihbe.supabase.co/functions/v1/weekly-github-assignments-refresh',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3MTUzOCwiZXhwIjoyMDY5MTQ3NTM4fQ.d-rBm6zzLV4zPB4y4RsT8Z7fVuC4X3V91cXTJg58xZQ"}'::jsonb,
    body:='{"trigger": "manual"}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (admins only)
REVOKE EXECUTE ON FUNCTION refresh_github_weekly_assignments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_github_weekly_assignments() TO authenticated;

-- Create RLS policy for the function (admin only access)
CREATE POLICY "Only admins can manually refresh assignments" ON github_user_tasks
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);