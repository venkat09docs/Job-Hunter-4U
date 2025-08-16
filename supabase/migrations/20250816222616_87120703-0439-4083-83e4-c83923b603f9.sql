-- Remove the view that was flagged as a security risk
DROP VIEW IF EXISTS public.safe_leaderboard_profiles;

-- The security definer function is sufficient and safer
-- It already exists from the previous migration and provides controlled access to safe profile data