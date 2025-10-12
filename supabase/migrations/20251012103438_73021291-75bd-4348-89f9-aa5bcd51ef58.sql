-- Add webhook_url column to smtp_configurations table
ALTER TABLE public.smtp_configurations 
ADD COLUMN IF NOT EXISTS automation_webhook_url text;

-- Add a comment to describe the column
COMMENT ON COLUMN public.smtp_configurations.automation_webhook_url IS 'Webhook URL for job automation integration';