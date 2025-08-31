-- Fix the queue_missed_webhooks function with correct auth.users columns
CREATE OR REPLACE FUNCTION public.queue_missed_webhooks()
RETURNS TABLE(queued_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  queued_users integer := 0;
  user_record record;
BEGIN
  -- Find users created since Aug 18, 2025 who don't have webhook entries
  FOR user_record IN
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.updated_at,
      au.email_confirmed_at,
      au.phone,
      au.raw_user_meta_data,
      au.last_sign_in_at,
      au.confirmed_at,
      p.full_name,
      p.username
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE au.created_at >= '2025-08-18'::timestamptz
    AND NOT EXISTS (
      SELECT 1 FROM public.webhook_queue wq 
      WHERE wq.user_id = au.id
    )
  LOOP
    -- Add missed webhook to queue
    INSERT INTO public.webhook_queue (
      user_id,
      webhook_url,
      user_data,
      status
    ) VALUES (
      user_record.id,
      'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
      jsonb_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'full_name', COALESCE(user_record.full_name, user_record.raw_user_meta_data ->> 'full_name', user_record.raw_user_meta_data ->> 'Display Name', user_record.email),
        'username', COALESCE(user_record.username, user_record.raw_user_meta_data ->> 'username', split_part(user_record.email, '@', 1)),
        'industry', COALESCE(user_record.raw_user_meta_data ->> 'industry', 'IT'),
        'created_at', user_record.created_at,
        'updated_at', user_record.updated_at,
        'email_verified', CASE WHEN user_record.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        'phone', user_record.phone,
        'raw_user_meta_data', user_record.raw_user_meta_data,
        'provider', 'email',
        'providers', '["email"]',
        'last_sign_in_at', user_record.last_sign_in_at,
        'confirmed_at', COALESCE(user_record.confirmed_at, user_record.email_confirmed_at),
        'role', 'authenticated',
        'signup_source', 'web_application',
        'timestamp', now()
      ),
      'pending'
    );
    
    queued_users := queued_users + 1;
  END LOOP;

  RETURN QUERY SELECT queued_users, 'Successfully queued ' || queued_users || ' missed webhooks for processing';
END;
$$;