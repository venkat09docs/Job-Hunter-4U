-- Add professional details columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio_link_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS digital_profile_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leetcode_url TEXT;