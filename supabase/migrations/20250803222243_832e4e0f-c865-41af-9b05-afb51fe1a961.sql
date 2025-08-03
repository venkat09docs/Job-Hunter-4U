-- Add is_default column to saved_resumes table
ALTER TABLE public.saved_resumes 
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- Create unique constraint to ensure only one default resume per user
CREATE UNIQUE INDEX idx_saved_resumes_user_default 
ON public.saved_resumes (user_id) 
WHERE is_default = true;

-- Add comment explaining the constraint
COMMENT ON INDEX idx_saved_resumes_user_default IS 'Ensures only one resume can be marked as default per user';