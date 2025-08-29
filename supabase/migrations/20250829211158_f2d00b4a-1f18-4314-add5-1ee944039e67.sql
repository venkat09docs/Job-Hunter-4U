-- Add foreign key constraint between linkedin_user_tasks and profiles
-- This will enable proper joins and fix the "Missing User" issue

-- First check if the constraint already exists
DO $$ 
BEGIN
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'linkedin_user_tasks_user_id_fkey'
    AND table_name = 'linkedin_user_tasks'
  ) THEN
    ALTER TABLE public.linkedin_user_tasks 
    ADD CONSTRAINT linkedin_user_tasks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;