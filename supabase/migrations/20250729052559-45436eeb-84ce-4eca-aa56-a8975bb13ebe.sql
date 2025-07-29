-- Create premium_features table to store which features require subscription
CREATE TABLE public.premium_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.premium_features ENABLE ROW LEVEL SECURITY;

-- Create policies for premium_features
CREATE POLICY "Everyone can view premium features" 
ON public.premium_features 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert premium features" 
ON public.premium_features 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update premium features" 
ON public.premium_features 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete premium features" 
ON public.premium_features 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default sidebar menu features
INSERT INTO public.premium_features (feature_key, feature_name, description, is_premium) VALUES
('dashboard', 'Dashboard', 'Main dashboard overview', false),
('job-search', 'Job Search', 'Search for job opportunities', false),
('job-tracker', 'Job Tracker', 'Track job applications', true),
('linkedin-automation', 'LinkedIn Automation', 'Automate LinkedIn activities', true),
('digital-career-hub', 'AI-Powered Career Tools', 'Access AI career tools', true),
('talent-screener', 'Talent Screener', 'Screen and evaluate talent', true),
('portfolio', 'My Portfolio', 'Personal portfolio management', false),
('blog', 'Blog Dashboard', 'Manage blog posts', true),
('profile', 'Edit Bio Tree', 'Edit public bio profile', false);

-- Create trigger to update updated_at
CREATE TRIGGER update_premium_features_updated_at
BEFORE UPDATE ON public.premium_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();