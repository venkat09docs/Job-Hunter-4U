-- Create social proof events table to track user activities
CREATE TABLE public.social_proof_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  display_text TEXT NOT NULL,
  location TEXT,
  user_first_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create social proof configuration table for admin controls
CREATE TABLE public.social_proof_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_on_landing_page BOOLEAN NOT NULL DEFAULT true,
  show_after_signin BOOLEAN NOT NULL DEFAULT true,
  display_duration INTEGER NOT NULL DEFAULT 5000, -- milliseconds
  rotation_interval INTEGER NOT NULL DEFAULT 10000, -- milliseconds
  max_events_shown INTEGER NOT NULL DEFAULT 10,
  enabled_event_types TEXT[] NOT NULL DEFAULT ARRAY['signup', 'premium_upgrade', 'job_application', 'resume_completion'],
  position TEXT NOT NULL DEFAULT 'bottom-left',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default configuration
INSERT INTO public.social_proof_config (id) VALUES (gen_random_uuid());

-- Enable RLS on social proof events
ALTER TABLE public.social_proof_events ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active events (for social proof display)
CREATE POLICY "Everyone can view active social proof events" 
ON public.social_proof_events 
FOR SELECT 
USING (is_active = true AND expires_at > now());

-- Policy: Service role can insert events (for automatic tracking)
CREATE POLICY "Service role can insert social proof events" 
ON public.social_proof_events 
FOR INSERT 
WITH CHECK (true);

-- Policy: Admins can manage events
CREATE POLICY "Admins can manage social proof events" 
ON public.social_proof_events 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on social proof config
ALTER TABLE public.social_proof_config ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view config (needed for display settings)
CREATE POLICY "Everyone can view social proof config" 
ON public.social_proof_config 
FOR SELECT 
USING (is_active = true);

-- Policy: Admins can manage config
CREATE POLICY "Admins can manage social proof config" 
ON public.social_proof_config 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient querying
CREATE INDEX idx_social_proof_events_active ON public.social_proof_events (is_active, expires_at, created_at DESC);
CREATE INDEX idx_social_proof_events_type ON public.social_proof_events (event_type);

-- Function to automatically create social proof events
CREATE OR REPLACE FUNCTION public.create_social_proof_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_user_first_name TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
  display_text TEXT;
  locations TEXT[] := ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
  random_location TEXT;
BEGIN
  -- Generate random location if not provided
  IF p_location IS NULL THEN
    random_location := locations[floor(random() * array_length(locations, 1) + 1)];
  ELSE
    random_location := p_location;
  END IF;

  -- Generate display text based on event type
  CASE p_event_type
    WHEN 'signup' THEN
      display_text := COALESCE(p_user_first_name, 'Someone') || ' from ' || random_location || ' just signed up';
    WHEN 'premium_upgrade' THEN
      display_text := COALESCE(p_user_first_name, 'Someone') || ' from ' || random_location || ' just upgraded to Premium';
    WHEN 'job_application' THEN
      display_text := COALESCE(p_user_first_name, 'Someone') || ' from ' || random_location || ' just applied to a job';
    WHEN 'resume_completion' THEN
      display_text := COALESCE(p_user_first_name, 'Someone') || ' from ' || random_location || ' just completed their resume';
    WHEN 'linkedin_optimization' THEN
      display_text := COALESCE(p_user_first_name, 'Someone') || ' from ' || random_location || ' optimized their LinkedIn profile';
    WHEN 'github_setup' THEN
      display_text := COALESCE(p_user_first_name, 'Someone') || ' from ' || random_location || ' set up their GitHub profile';
    ELSE
      display_text := COALESCE(p_user_first_name, 'Someone') || ' from ' || random_location || ' completed an activity';
  END CASE;

  -- Insert the event
  INSERT INTO public.social_proof_events (
    user_id,
    event_type,
    event_data,
    display_text,
    location,
    user_first_name
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_data,
    display_text,
    random_location,
    p_user_first_name
  ) RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;

-- Trigger to create social proof events for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user_social_proof()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  first_name TEXT;
BEGIN
  -- Extract first name from metadata
  first_name := NEW.raw_user_meta_data ->> 'full_name';
  IF first_name IS NULL OR first_name = '' THEN
    first_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Create social proof event for signup
  PERFORM public.create_social_proof_event(
    NEW.id,
    'signup',
    jsonb_build_object('email', NEW.email, 'signup_method', 'email'),
    first_name
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created_social_proof
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_social_proof();

-- Function to update social proof config
CREATE OR REPLACE FUNCTION public.update_social_proof_config_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to update timestamp on config changes
CREATE TRIGGER update_social_proof_config_updated_at
  BEFORE UPDATE ON public.social_proof_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_social_proof_config_timestamp();