-- Create table for daily job hunting task submissions
CREATE TABLE public.daily_job_hunting_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('job_applications', 'referral_requests', 'follow_up_messages')),
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_count INTEGER NOT NULL DEFAULT 5,
  actual_count INTEGER NOT NULL DEFAULT 0,
  evidence_data JSONB DEFAULT '{}',
  evidence_urls TEXT[],
  file_urls TEXT[],
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewer_notes TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_type, task_date)
);

-- Enable RLS
ALTER TABLE public.daily_job_hunting_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for daily job hunting tasks
CREATE POLICY "Users can view their own daily tasks" 
ON public.daily_job_hunting_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily tasks" 
ON public.daily_job_hunting_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily tasks" 
ON public.daily_job_hunting_tasks 
FOR UPDATE 
USING (auth.uid() = user_id AND status IN ('pending', 'rejected'));

-- Admins can manage all daily tasks
CREATE POLICY "Admins can manage all daily tasks" 
ON public.daily_job_hunting_tasks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Recruiters can manage non-institute user daily tasks
CREATE POLICY "Recruiters can manage non-institute daily tasks" 
ON public.daily_job_hunting_tasks 
FOR ALL 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = daily_job_hunting_tasks.user_id 
    AND ua.is_active = true
  )
);

-- Institute admins can manage their institute students' daily tasks
CREATE POLICY "Institute admins can manage institute daily tasks" 
ON public.daily_job_hunting_tasks 
FOR ALL 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = daily_job_hunting_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_daily_job_hunting_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_job_hunting_tasks_updated_at
  BEFORE UPDATE ON public.daily_job_hunting_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_job_hunting_tasks_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_daily_job_hunting_tasks_user_date ON public.daily_job_hunting_tasks(user_id, task_date);
CREATE INDEX idx_daily_job_hunting_tasks_status ON public.daily_job_hunting_tasks(status);
CREATE INDEX idx_daily_job_hunting_tasks_type ON public.daily_job_hunting_tasks(task_type);