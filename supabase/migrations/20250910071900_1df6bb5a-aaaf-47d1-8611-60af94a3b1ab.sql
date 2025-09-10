-- Create table for job hunting extension requests
CREATE TABLE public.job_hunting_extension_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assignment_id TEXT NOT NULL,
  assignment_type TEXT NOT NULL DEFAULT 'daily_session',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_hunting_extension_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for job hunting extension requests
CREATE POLICY "Users can create their own extension requests" 
ON public.job_hunting_extension_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own extension requests" 
ON public.job_hunting_extension_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all extension requests" 
ON public.job_hunting_extension_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

CREATE POLICY "Institute admins can manage institute extension requests" 
ON public.job_hunting_extension_requests 
FOR ALL 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  EXISTS (
    SELECT 1 
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = job_hunting_extension_requests.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_hunting_extension_requests_updated_at
BEFORE UPDATE ON public.job_hunting_extension_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();