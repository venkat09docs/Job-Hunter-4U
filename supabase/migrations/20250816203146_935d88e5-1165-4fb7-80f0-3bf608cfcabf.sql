-- Create jobs table for internal job postings
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  job_type TEXT,
  experience_level TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  benefits TEXT,
  application_deadline DATE,
  posted_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'job_posted',
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for jobs
CREATE POLICY "Everyone can view active jobs" 
ON public.jobs 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Recruiters can create jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'recruiter'::app_role) AND auth.uid() = posted_by);

CREATE POLICY "Recruiters can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (has_role(auth.uid(), 'recruiter'::app_role) AND auth.uid() = posted_by);

CREATE POLICY "Admins can manage all jobs" 
ON public.jobs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for jobs updated_at
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_jobs_updated_at();

-- Create function to notify all institute users when a job is posted
CREATE OR REPLACE FUNCTION public.notify_job_posted()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all users assigned to institutes
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT DISTINCT ua.user_id,
    'New Job Posted',
    'A new job opportunity "' || NEW.title || '" at ' || NEW.company || ' has been posted!',
    'job_posted',
    NEW.id
  FROM public.user_assignments ua
  WHERE ua.is_active = true
    AND ua.user_id != NEW.posted_by; -- Don't notify the poster

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to notify users when job is posted
CREATE TRIGGER notify_users_on_job_post
AFTER INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.notify_job_posted();