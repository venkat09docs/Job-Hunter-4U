-- Create job applications tracking table
CREATE TABLE IF NOT EXISTS public.job_applications_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Enable RLS
ALTER TABLE public.job_applications_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own applications"
ON public.job_applications_tracking
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own applications"
ON public.job_applications_tracking
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and recruiters can view all applications"
ON public.job_applications_tracking
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role)
);

-- Create index for performance
CREATE INDEX idx_job_applications_job_id ON public.job_applications_tracking(job_id);
CREATE INDEX idx_job_applications_user_id ON public.job_applications_tracking(user_id);
CREATE INDEX idx_job_applications_applied_at ON public.job_applications_tracking(applied_at DESC);