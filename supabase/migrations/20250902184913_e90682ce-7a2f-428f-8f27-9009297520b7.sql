-- Create a trigger function to handle new user signups and call the webhook
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_response text;
BEGIN
  -- Log the new user signup
  RAISE LOG 'New user signup detected: %', NEW.id;
  
  BEGIN
    -- Call the user-signup-webhook edge function
    SELECT content INTO webhook_response
    FROM http((
      'POST',
      'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3MTUzOCwiZXhwIjoyMDY5MTQ3NTM4fQ.d-rBm6zzLV4zPB4y4RsT8Z7fVuC4X3V91cXTJg58xZQ')
      ],
      'application/json',
      json_build_object(
        'type', 'INSERT',
        'table', 'users',
        'record', json_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'created_at', NEW.created_at,
          'updated_at', NEW.updated_at,
          'email_confirmed_at', NEW.email_confirmed_at,
          'raw_user_meta_data', NEW.raw_user_meta_data,
          'app_metadata', NEW.raw_app_meta_data,
          'user_metadata', NEW.raw_user_meta_data
        ),
        'schema', 'auth'
      )::text
    ));
    
    RAISE LOG 'Webhook called successfully for user %: %', NEW.id, webhook_response;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE WARNING 'Error in handle_new_user_with_webhook for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table to call webhook on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_webhook ON auth.users;
CREATE TRIGGER on_auth_user_created_webhook
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_webhook();