-- Add admin override policy for github_user_tasks deletion
CREATE POLICY "Admins can manage all GitHub user tasks" 
ON public.github_user_tasks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));