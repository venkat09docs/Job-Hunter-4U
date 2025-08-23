-- Add re-enable request functionality for LinkedIn tasks

-- Create table for re-enable requests
CREATE TABLE IF NOT EXISTS public.linkedin_task_renable_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_task_id UUID NOT NULL REFERENCES public.linkedin_user_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for re-enable requests
ALTER TABLE public.linkedin_task_renable_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own re-enable requests
CREATE POLICY "Users can create their own re-enable requests" ON public.linkedin_task_renable_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own re-enable requests
CREATE POLICY "Users can view their own re-enable requests" ON public.linkedin_task_renable_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view and manage all re-enable requests
CREATE POLICY "Admins can manage all re-enable requests" ON public.linkedin_task_renable_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Institute admins can view and manage requests for their students
CREATE POLICY "Institute admins can manage student re-enable requests" ON public.linkedin_task_renable_requests
  FOR ALL USING (
    has_role(auth.uid(), 'institute_admin'::app_role) 
    AND EXISTS (
      SELECT 1
      FROM user_assignments ua
      JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
      WHERE ua.user_id = linkedin_task_renable_requests.user_id 
        AND iaa.user_id = auth.uid() 
        AND ua.is_active = true 
        AND iaa.is_active = true
    )
  );

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_linkedin_task_renable_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_linkedin_task_renable_requests_updated_at
  BEFORE UPDATE ON public.linkedin_task_renable_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_linkedin_task_renable_requests_updated_at();

-- Add extension field to linkedin_user_tasks for admin re-enables
ALTER TABLE public.linkedin_user_tasks 
ADD COLUMN IF NOT EXISTS admin_extended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS extended_by UUID,
ADD COLUMN IF NOT EXISTS extended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extension_reason TEXT;