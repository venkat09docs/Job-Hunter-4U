-- Add verification_notes field to linkedin_user_tasks table
-- This allows admins to add notes when reviewing LinkedIn assignments

ALTER TABLE public.linkedin_user_tasks 
ADD COLUMN IF NOT EXISTS verification_notes TEXT;