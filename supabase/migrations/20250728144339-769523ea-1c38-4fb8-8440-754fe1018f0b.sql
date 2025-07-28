-- Add subscription-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_plan TEXT DEFAULT NULL,
ADD COLUMN subscription_start_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN subscription_end_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN subscription_active BOOLEAN DEFAULT FALSE;

-- Remove the tokens_remaining column as we're moving to time-based system
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS tokens_remaining;

-- Create a function to calculate remaining days
CREATE OR REPLACE FUNCTION public.get_subscription_days_remaining(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  end_date TIMESTAMPTZ;
  remaining_days INTEGER;
BEGIN
  SELECT subscription_end_date INTO end_date
  FROM public.profiles
  WHERE user_id = user_id_param;
  
  IF end_date IS NULL THEN
    RETURN 0;
  END IF;
  
  remaining_days := EXTRACT(DAY FROM (end_date - NOW()));
  
  IF remaining_days < 0 THEN
    RETURN 0;
  END IF;
  
  RETURN remaining_days;
END;
$$;

-- Update the handle_new_user function to not set tokens_remaining
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile without tokens_remaining
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'username'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;