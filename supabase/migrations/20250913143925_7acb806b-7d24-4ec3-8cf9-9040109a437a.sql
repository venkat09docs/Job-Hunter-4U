-- Create function to trigger user signup webhook
CREATE OR REPLACE FUNCTION public.trigger_user_signup_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into webhook queue for processing
  INSERT INTO public.webhook_queue (
    user_id,
    user_data,
    status,
    webhook_url
  ) VALUES (
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at,
      'email_confirmed_at', NEW.email_confirmed_at,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'app_metadata', NEW.raw_app_meta_data,
      'user_metadata', NEW.raw_user_meta_data,
      'full_name', COALESCE(
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'Display Name',
        split_part(NEW.email, '@', 1)
      ),
      'username', COALESCE(
        NEW.raw_user_meta_data ->> 'username',
        split_part(NEW.email, '@', 1)
      ),
      'industry', COALESCE(NEW.raw_user_meta_data ->> 'industry', 'Non-IT'),
      'signup_source', 'web_application',
      'timestamp', NOW()
    ),
    'pending',
    'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in trigger_user_signup_webhook for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_signup_webhook
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.trigger_user_signup_webhook();