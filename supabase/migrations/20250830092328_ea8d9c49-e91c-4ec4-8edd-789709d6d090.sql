-- Add RLS policies for recruiters to access GitHub assignments and extension requests

-- Allow recruiters to view all GitHub user tasks for verification
CREATE POLICY "Recruiters can view all GitHub user tasks for verification" 
ON public.github_user_tasks 
FOR SELECT 
USING (has_role(auth.uid(), 'recruiter'::app_role));

-- Allow recruiters to update GitHub user tasks for verification
CREATE POLICY "Recruiters can update GitHub user tasks for verification" 
ON public.github_user_tasks 
FOR UPDATE 
USING (has_role(auth.uid(), 'recruiter'::app_role));

-- Allow recruiters to view all extension requests
CREATE POLICY "Recruiters can view all extension requests" 
ON public.linkedin_task_renable_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'recruiter'::app_role));

-- Allow recruiters to update extension requests (approve/reject)
CREATE POLICY "Recruiters can update extension requests" 
ON public.linkedin_task_renable_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'recruiter'::app_role));