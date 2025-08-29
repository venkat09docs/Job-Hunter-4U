-- Add verification_notes field to github_user_tasks table
-- This allows admins to add notes when reviewing GitHub assignments

ALTER TABLE public.github_user_tasks 
ADD COLUMN IF NOT EXISTS verification_notes TEXT;