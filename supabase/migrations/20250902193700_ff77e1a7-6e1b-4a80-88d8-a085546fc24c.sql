-- Fix RLS policies for job_hunting_assignments and github_user_tasks
-- to ensure institute admins only see assignments from their institute users

-- First check and fix job_hunting_assignments policies
DO $$
BEGIN
  -- Drop problematic policies that allow seeing all assignments
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_hunting_assignments' AND policyname = 'Institute admins can view all job hunting assignments') THEN
    DROP POLICY "Institute admins can view all job hunting assignments" ON public.job_hunting_assignments;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_hunting_assignments' AND policyname = 'Institute admins can manage job hunting assignments') THEN
    DROP POLICY "Institute admins can manage job hunting assignments" ON public.job_hunting_assignments;
  END IF;
  
  -- Create proper institute admin policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_hunting_assignments' AND policyname = 'Institute admins can manage their institute job hunting assignments') THEN
    CREATE POLICY "Institute admins can manage their institute job hunting assignments"
    ON public.job_hunting_assignments
    FOR ALL
    TO authenticated
    USING (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM user_assignments ua
        JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
        WHERE ua.user_id = job_hunting_assignments.user_id
          AND iaa.user_id = auth.uid()
          AND ua.is_active = true
          AND iaa.is_active = true
      )
    )
    WITH CHECK (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM user_assignments ua
        JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
        WHERE ua.user_id = job_hunting_assignments.user_id
          AND iaa.user_id = auth.uid()
          AND ua.is_active = true
          AND iaa.is_active = true
      )
    );
  END IF;
END $$;

-- Now check and fix github_user_tasks policies
DO $$
BEGIN
  -- Drop problematic policies that allow seeing all tasks
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'github_user_tasks' AND policyname = 'Institute admins can view all GitHub tasks') THEN
    DROP POLICY "Institute admins can view all GitHub tasks" ON public.github_user_tasks;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'github_user_tasks' AND policyname = 'Institute admins can manage GitHub tasks') THEN
    DROP POLICY "Institute admins can manage GitHub tasks" ON public.github_user_tasks;
  END IF;
  
  -- Create proper institute admin policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'github_user_tasks' AND policyname = 'Institute admins can manage their institute GitHub tasks') THEN
    CREATE POLICY "Institute admins can manage their institute GitHub tasks"
    ON public.github_user_tasks
    FOR ALL
    TO authenticated
    USING (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM user_assignments ua
        JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
        WHERE ua.user_id = github_user_tasks.user_id
          AND iaa.user_id = auth.uid()
          AND ua.is_active = true
          AND iaa.is_active = true
      )
    )
    WITH CHECK (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM user_assignments ua
        JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
        WHERE ua.user_id = github_user_tasks.user_id
          AND iaa.user_id = auth.uid()
          AND ua.is_active = true
          AND iaa.is_active = true
      )
    );
  END IF;
END $$;