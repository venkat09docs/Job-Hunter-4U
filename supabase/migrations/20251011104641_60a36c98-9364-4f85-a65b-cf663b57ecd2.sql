-- Create table for storing resume analysis reports
CREATE TABLE public.resume_analysis_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_description TEXT NOT NULL,
  key_skills TEXT[] NOT NULL DEFAULT '{}',
  analysis_result JSONB NOT NULL DEFAULT '{}',
  resume_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resume_analysis_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view their own analysis reports"
  ON public.resume_analysis_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert their own analysis reports"
  ON public.resume_analysis_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update their own analysis reports"
  ON public.resume_analysis_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete their own analysis reports"
  ON public.resume_analysis_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_resume_analysis_reports_user_job 
  ON public.resume_analysis_reports(user_id, job_title, company_name);

-- Create trigger to update updated_at
CREATE TRIGGER update_resume_analysis_reports_updated_at
  BEFORE UPDATE ON public.resume_analysis_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: update_updated_at_column() function should already exist in the database