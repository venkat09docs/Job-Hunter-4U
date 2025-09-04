-- Fix the handle_basic_user_signup function to generate unique usernames
CREATE OR REPLACE FUNCTION public.handle_basic_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
  username_counter integer := 1;
BEGIN
  -- Generate base username
  base_username := lower(regexp_replace(
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'Display Name',
      split_part(NEW.email, '@', 1)
    ), 
    '[^a-zA-Z0-9]', '', 'g'
  ));
  
  -- Ensure base_username is not empty
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;
  
  -- Find unique username
  final_username := base_username;
  
  -- Keep trying until we find a unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || username_counter::text;
    username_counter := username_counter + 1;
  END LOOP;

  -- Create profile with unique username
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
    final_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_basic_user_signup for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;