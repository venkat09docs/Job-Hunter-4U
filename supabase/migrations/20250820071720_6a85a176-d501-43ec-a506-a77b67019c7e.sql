-- Fix RLS policies for institute admin access to student data
-- This allows institute admins to view student records from their assigned institutes

-- Allow institute admins to view daily progress snapshots of their students
CREATE POLICY "Institute admins can view student progress snapshots"
ON public.daily_progress_snapshots
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = daily_progress_snapshots.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

-- Allow institute admins to view job tracker entries of their students
CREATE POLICY "Institute admins can view student job applications"
ON public.job_tracker
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = job_tracker.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

-- Allow institute admins to view resume data of their students
CREATE POLICY "Institute admins can view student resume data"
ON public.resume_data
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = resume_data.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

-- Allow institute admins to view user activity points of their students
CREATE POLICY "Institute admins can view student activity points"
ON public.user_activity_points
FOR SELECT
TO authenticated
USING (
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
);

-- Allow institute admins to view leaderboard rankings of their students
CREATE POLICY "Institute admins can view student leaderboard rankings"
ON public.leaderboard_rankings
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = leaderboard_rankings.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

-- Also allow institute admins to view blogs from their students (for published blog counts)
CREATE POLICY "Institute admins can view student blogs"
ON public.blogs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = blogs.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

-- Allow institute admins to view LinkedIn network metrics of their students
CREATE POLICY "Institute admins can view student LinkedIn metrics"
ON public.linkedin_network_metrics
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = linkedin_network_metrics.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);