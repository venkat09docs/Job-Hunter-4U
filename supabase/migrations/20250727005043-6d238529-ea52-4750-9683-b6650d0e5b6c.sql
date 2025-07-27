-- Create public profiles table for job seekers
CREATE TABLE public.public_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  profile_image_url TEXT,
  full_name TEXT NOT NULL,
  bio TEXT,
  video_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  blog_url TEXT,
  custom_links JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for management but allow public viewing
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for public viewing (no authentication required)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.public_profiles 
FOR SELECT 
USING (is_public = true);

-- Policy for users to manage their own profile
CREATE POLICY "Users can insert their own public profile" 
ON public.public_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own public profile" 
ON public.public_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own public profile" 
ON public.public_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_public_profiles_updated_at
BEFORE UPDATE ON public.public_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for slug lookups
CREATE INDEX idx_public_profiles_slug ON public.public_profiles(slug);
CREATE INDEX idx_public_profiles_user_id ON public.public_profiles(user_id);