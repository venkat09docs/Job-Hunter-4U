-- Disable automatic institute assignment during signup
-- Comment out the trigger that processes webhook notifications for user signup

-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_webhook_received ON webhook_queue;

-- Comment out the webhook processing function (keep it for future use)
-- The process_webhook_notifications function will remain but won't be called

-- Also disable any direct user creation trigger that might assign institutes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Keep the handle_new_user function but don't trigger it automatically
-- Users can still be manually assigned to institutes later

-- Add a comment to indicate this is temporarily disabled
COMMENT ON FUNCTION public.process_webhook_notifications() IS 'TEMPORARILY DISABLED - Automatic institute assignment disabled during signup';

-- Create a simple user profile creation function for basic signup
CREATE OR REPLACE FUNCTION public.handle_basic_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create basic profile, no automatic institute assignment
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    username, 
    email, 
    industry
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'Display Name',
      split_part(NEW.email, '@', 1)
    ),
    -- Generate clean username
    lower(regexp_replace(
      COALESCE(
        NEW.raw_user_meta_data ->> 'username',
        NEW.raw_user_meta_data ->> 'full_name',
        split_part(NEW.email, '@', 1)
      ), 
      '[^a-zA-Z0-9]', '', 'g'
    )),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create a basic trigger for user profile creation (no institute assignment)
CREATE TRIGGER on_auth_user_basic_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_basic_user_signup();