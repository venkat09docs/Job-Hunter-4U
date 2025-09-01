-- Remove automatic GitHub weekly assignments refresh cron jobs
-- This makes GitHub weekly activities work like LinkedIn (on-demand only)

-- Drop the existing cron jobs for automatic GitHub weekly refresh
SELECT cron.unschedule('refresh-github-weekly-assignments');
SELECT cron.unschedule('weekly-github-assignments-refresh');