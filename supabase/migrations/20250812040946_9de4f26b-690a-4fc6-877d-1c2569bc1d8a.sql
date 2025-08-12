-- Add unique constraint on user_id and task_id combination for github_progress table
ALTER TABLE public.github_progress 
ADD CONSTRAINT github_progress_user_task_unique 
UNIQUE (user_id, task_id);