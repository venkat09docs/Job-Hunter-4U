-- Remove anonymous public SELECT to prevent direct table reads of personal data
DROP POLICY IF EXISTS "Anonymous users can view single public profile by slug" ON public.public_profiles;