-- Create a webhook queue table to store pending webhooks
CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_data jsonb NOT NULL,
  webhook_url text NOT NULL DEFAULT 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  error_message text
);

-- Enable RLS
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for the webhook queue
CREATE POLICY "Service role can manage webhook queue" ON public.webhook_queue
FOR ALL USING (true);

-- Create a simpler trigger function that just stores the data
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, username, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    updated_at = now();
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Store webhook data in queue for processing
  INSERT INTO public.webhook_queue (user_id, user_data)
  VALUES (
    NEW.id,
    json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
      'username', COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at,
      'email_confirmed_at', NEW.email_confirmed_at,
      'last_sign_in_at', NEW.last_sign_in_at,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'phone', NEW.phone,
      'confirmed_at', NEW.confirmed_at,
      'email_verified', CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
      'provider', 'email',
      'role', 'authenticated',
      'signup_source', 'web_application',
      'timestamp', now()
    )::jsonb
  );
  
  RETURN NEW;
END;
$$;