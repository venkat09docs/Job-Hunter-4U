-- Fix RLS policies for career_task_assignments to work with actual role system
DROP POLICY IF EXISTS "System can manage assignments" ON career_task_assignments;

CREATE POLICY "Admins can manage all assignments" 
ON career_task_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Fix RLS policies for career_task_templates
DROP POLICY IF EXISTS "Admins can manage templates" ON career_task_templates;

CREATE POLICY "Admins can manage templates" 
ON career_task_templates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Fix RLS policies for career_task_evidence  
DROP POLICY IF EXISTS "Admins can manage all evidence" ON career_task_evidence;

CREATE POLICY "Admins can manage all evidence" 
ON career_task_evidence 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);