-- Fix RLS policies on user_activity_points table to properly filter by institute
-- The current "Authenticated users can view activity points for leaderboard" policy allows all users to see all data

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view activity points for leaderboard" ON public.user_activity_points;

-- Create proper filtering policies for user_activity_points
CREATE POLICY "Institute users can view their institute activity points"
ON public.user_activity_points
FOR SELECT
TO authenticated
USING (
  -- Admins can see all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Users can see their own activity points
  (auth.uid() = user_id)
  OR
  -- Institute users can see activity points from users in their same institute
  (
    EXISTS (
      SELECT 1 FROM user_assignments ua1 
      WHERE ua1.user_id = auth.uid() 
        AND ua1.is_active = true
    )
    AND EXISTS (
      SELECT 1 FROM user_assignments ua1, user_assignments ua2
      WHERE ua1.user_id = auth.uid()
        AND ua2.user_id = user_activity_points.user_id
        AND ua1.institute_id = ua2.institute_id
        AND ua1.is_active = true
        AND ua2.is_active = true
    )
  )
  OR
  -- Non-institute users can see activity points from other non-institute users  
  (
    NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = auth.uid() 
        AND ua.is_active = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = user_activity_points.user_id 
        AND ua.is_active = true
    )
  )
  OR
  -- Institute admins can see their managed institute users' activity points
  (
    has_role(auth.uid(), 'institute_admin'::app_role) 
    AND EXISTS (
      SELECT 1
      FROM user_assignments ua
      JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
      WHERE ua.user_id = user_activity_points.user_id
        AND iaa.user_id = auth.uid()
        AND ua.is_active = true
        AND iaa.is_active = true
    )
  )
  OR
  -- Recruiters can see non-institute users' activity points
  (
    has_role(auth.uid(), 'recruiter'::app_role) 
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = user_activity_points.user_id 
        AND ua.is_active = true
    )
  )
);