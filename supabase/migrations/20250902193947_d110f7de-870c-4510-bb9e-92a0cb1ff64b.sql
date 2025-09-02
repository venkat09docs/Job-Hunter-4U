-- Fix RLS policies for linkedin_user_tasks to ensure institute admins only see tasks from their institute users

DO $$
BEGIN
  -- Drop problematic policies that allow seeing all LinkedIn tasks
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'linkedin_user_tasks' AND policyname = 'Institute admins can view all LinkedIn tasks') THEN
    DROP POLICY "Institute admins can view all LinkedIn tasks" ON public.linkedin_user_tasks;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'linkedin_user_tasks' AND policyname = 'Institute admins can manage LinkedIn tasks') THEN
    DROP POLICY "Institute admins can manage LinkedIn tasks" ON public.linkedin_user_tasks;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'linkedin_user_tasks' AND policyname = 'Institute admins manage their institute LinkedIn tasks') THEN
    DROP POLICY "Institute admins manage their institute LinkedIn tasks" ON public.linkedin_user_tasks;
  END IF;
  
  -- Create proper institute admin policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'linkedin_user_tasks' AND policyname = 'Institute admins can manage their institute LinkedIn tasks') THEN
    CREATE POLICY "Institute admins can manage their institute LinkedIn tasks"
    ON public.linkedin_user_tasks
    FOR ALL
    TO authenticated
    USING (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM user_assignments ua
        JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
        WHERE ua.user_id = linkedin_user_tasks.user_id
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
        WHERE ua.user_id = linkedin_user_tasks.user_id
          AND iaa.user_id = auth.uid()
          AND ua.is_active = true
          AND iaa.is_active = true
      )
    );
  END IF;
  
  -- Ensure we have proper recruiter policy for non-institute users
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'linkedin_user_tasks' AND policyname = 'Recruiters can manage non-institute LinkedIn tasks') THEN
    CREATE POLICY "Recruiters can manage non-institute LinkedIn tasks"
    ON public.linkedin_user_tasks
    FOR ALL
    TO authenticated
    USING (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = linkedin_user_tasks.user_id 
          AND ua.is_active = true
      )
    )
    WITH CHECK (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = linkedin_user_tasks.user_id 
          AND ua.is_active = true
      )
    );
  END IF;
  
  -- Ensure service role policy exists
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'linkedin_user_tasks' AND policyname = 'Service role can manage LinkedIn tasks') THEN
    CREATE POLICY "Service role can manage LinkedIn tasks"
    ON public.linkedin_user_tasks
    FOR ALL
    TO authenticated
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');
  END IF;
END $$;