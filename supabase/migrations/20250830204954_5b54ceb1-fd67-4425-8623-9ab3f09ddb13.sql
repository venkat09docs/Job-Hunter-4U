-- Create GitHub task reenable requests table for extension requests
CREATE TABLE IF NOT EXISTS public.github_task_reenable_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint to github_user_tasks
ALTER TABLE public.github_task_reenable_requests 
ADD CONSTRAINT github_task_reenable_requests_user_task_id_fkey 
FOREIGN KEY (user_task_id) REFERENCES public.github_user_tasks(id) ON DELETE CASCADE;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_github_task_reenable_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_github_task_reenable_requests_updated_at
  BEFORE UPDATE ON public.github_task_reenable_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_github_task_reenable_requests_updated_at();

-- Enable RLS
ALTER TABLE public.github_task_reenable_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own extension requests
CREATE POLICY "Users can create their own GitHub extension requests" 
ON public.github_task_reenable_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own extension requests
CREATE POLICY "Users can view their own GitHub extension requests" 
ON public.github_task_reenable_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins and recruiters can view all extension requests
CREATE POLICY "Admins and recruiters can view all GitHub extension requests" 
ON public.github_task_reenable_requests 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR
  has_role(auth.uid(), 'institute_admin'::app_role)
);

-- Admins and recruiters can update extension requests (for approval/rejection)
CREATE POLICY "Admins and recruiters can update GitHub extension requests" 
ON public.github_task_reenable_requests 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR
  has_role(auth.uid(), 'institute_admin'::app_role)
);

-- Add admin extension fields to github_user_tasks table if they don't exist
ALTER TABLE public.github_user_tasks 
ADD COLUMN IF NOT EXISTS admin_extended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS extended_by UUID,
ADD COLUMN IF NOT EXISTS extended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extension_reason TEXT;