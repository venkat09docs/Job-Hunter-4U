-- Add unique constraint on job_results table to prevent duplicate job entries per user
ALTER TABLE public.job_results 
ADD CONSTRAINT unique_user_job_id UNIQUE (user_id, job_id);