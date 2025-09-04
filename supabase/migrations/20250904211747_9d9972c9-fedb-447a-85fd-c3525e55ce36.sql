-- Drop all triggers first, then functions, then recreate with proper search_path
DROP TRIGGER IF EXISTS on_auth_user_created_social_proof ON auth.users;
DROP TRIGGER IF EXISTS update_social_proof_config_updated_at ON public.social_proof_config;
DROP FUNCTION IF EXISTS public.handle_new_user_social_proof();
DROP FUNCTION IF EXISTS public.create_social_proof_event(UUID, TEXT, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_social_proof_config_timestamp();

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.create_social_proof_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_user_first_name TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Recreate trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_social_proof()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Recreate config timestamp function with proper search_path
CREATE OR REPLACE FUNCTION public.update_social_proof_config_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER on_auth_user_created_social_proof
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_social_proof();

CREATE TRIGGER update_social_proof_config_updated_at
  BEFORE UPDATE ON public.social_proof_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_social_proof_config_timestamp();