-- Create a cron job to process webhook queue every 2 minutes
-- First ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job (run every 2 minutes)
SELECT cron.schedule('process-webhook-queue', '*/2 * * * *', 'SELECT public.process_pending_webhooks();');