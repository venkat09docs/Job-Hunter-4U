-- First, remove duplicate entries keeping only the most recent ones
DELETE FROM public.job_results 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, job_id) id
    FROM public.job_results 
    ORDER BY user_id, job_id, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE public.job_results 
ADD CONSTRAINT unique_user_job_id UNIQUE (user_id, job_id);