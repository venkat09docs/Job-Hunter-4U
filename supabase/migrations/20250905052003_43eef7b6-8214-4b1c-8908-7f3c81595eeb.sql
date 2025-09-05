-- Create function to handle new user signup webhook
CREATE OR REPLACE FUNCTION public.handle_new_user_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_industry text := 'Non-IT'; -- Default industry
BEGIN
  -- Extract industry from user metadata if available
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'industry' IS NOT NULL THEN
    user_industry := NEW.raw_user_meta_data->>'industry';
  END IF;

  -- Insert user data into webhook queue for processing
  INSERT INTO public.webhook_queue (
    user_id,
    user_data,
    webhook_url,
    status,
    created_at
  ) VALUES (
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'Display Name',
        split_part(NEW.email, '@', 1)
      ),
      'username', COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1)
      ),
      'industry', user_industry,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at,
      'email_verified', CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
      'phone', NEW.phone,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'provider', 'email',
      'role', 'authenticated',
      'signup_source', 'web_application',
      'timestamp', NOW(),
      'confirmed_at', NEW.confirmed_at,
      'email_confirmed_at', NEW.email_confirmed_at,
      'last_sign_in_at', NEW.last_sign_in_at
    ),
    'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
    'pending',
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Create trigger to fire when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_webhook ON auth.users;
CREATE TRIGGER on_auth_user_created_webhook
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_webhook();

-- Also create a function to manually process pending webhooks (can be called by edge functions or cron)
CREATE OR REPLACE FUNCTION public.process_pending_webhooks()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Call the webhook function to process pending items
  SELECT net.http_post(
    url:='https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{"trigger": "cron"}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;