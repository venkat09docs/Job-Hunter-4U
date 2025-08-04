-- Update the handle_new_user function to also trigger the webhook
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
  
  -- Call the webhook edge function
  PERFORM
    net.http_post(
      url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('user', row_to_json(NEW))
    );
  
  RETURN NEW;
END;
$function$;