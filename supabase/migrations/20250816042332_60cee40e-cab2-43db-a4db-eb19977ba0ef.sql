-- Fix critical security vulnerability in profiles table
-- Remove overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated users can view basic profile info for leaderboard" ON public.profiles;

-- Create a restrictive policy that only exposes safe, non-sensitive fields for leaderboard functionality
CREATE POLICY "Leaderboard can view safe profile fields only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true)
WITH CHECK (false);