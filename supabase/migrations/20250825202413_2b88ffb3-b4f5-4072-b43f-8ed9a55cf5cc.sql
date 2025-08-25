-- Add missing columns to career_task_assignments table for verification functionality
ALTER TABLE public.career_task_assignments 
ADD COLUMN IF NOT EXISTS verification_notes text,
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id);