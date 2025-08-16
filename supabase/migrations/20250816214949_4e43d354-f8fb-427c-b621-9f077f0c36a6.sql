-- Add job_url column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN job_url TEXT;