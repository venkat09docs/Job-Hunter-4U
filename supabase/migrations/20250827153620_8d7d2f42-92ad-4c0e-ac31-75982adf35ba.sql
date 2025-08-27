-- Add assignment details columns to job_tracker table for storing application requirements data
ALTER TABLE public.job_tracker ADD COLUMN IF NOT EXISTS assignment_details jsonb DEFAULT NULL;

-- Add a comment to explain the assignment_details column
COMMENT ON COLUMN public.job_tracker.assignment_details IS 'Stores assignment details filled when moving from wishlist to applied status, including application strategy, follow-up date, and completion status of requirements';