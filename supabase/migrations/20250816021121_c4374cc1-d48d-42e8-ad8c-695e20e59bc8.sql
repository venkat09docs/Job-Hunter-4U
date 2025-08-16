-- Add RLS policy to allow all authenticated users to view activity points for leaderboard purposes
CREATE POLICY "Authenticated users can view activity points for leaderboard"
ON public.user_activity_points
FOR SELECT
TO authenticated
USING (true);