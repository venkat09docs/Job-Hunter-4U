-- Update RLS policies for notification management - allow recruiters to manage triggers

-- Drop existing policy that only allows admins
DROP POLICY IF EXISTS "Admins can manage triggers" ON admin_notification_triggers;

-- Create new policy allowing both admins and recruiters
CREATE POLICY "Admins and recruiters can manage triggers" 
ON admin_notification_triggers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

-- Update notification_templates policies if they exist, otherwise create them
DO $$
BEGIN
  -- Check if notification_templates table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_templates') THEN
    -- Drop and recreate policies for notification_templates
    DROP POLICY IF EXISTS "Admins and recruiters can manage templates" ON notification_templates;
    DROP POLICY IF EXISTS "Everyone can view active templates" ON notification_templates;
    
    CREATE POLICY "Admins and recruiters can manage templates" 
    ON notification_templates 
    FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

    CREATE POLICY "Everyone can view active templates" 
    ON notification_templates 
    FOR SELECT 
    USING (is_active = true);
  END IF;
END $$;