-- Update the handle_new_user function to include phone_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  username_counter INTEGER := 1;
  user_industry TEXT := 'IT';
  user_phone TEXT := '';
  top_admin_id UUID;
BEGIN
  -- Extract industry from metadata
  IF NEW.raw_user_meta_data ->> 'industry' IS NOT NULL THEN
    user_industry := NEW.raw_user_meta_data ->> 'industry';
  END IF;
  
  -- Extract phone number from metadata
  IF NEW.raw_user_meta_data ->> 'phone_number' IS NOT NULL THEN
    user_phone := NEW.raw_user_meta_data ->> 'phone_number';
  END IF;

  -- Generate clean username from metadata
  base_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'Display Name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Clean username: remove non-alphanumeric chars and make lowercase  
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure username is not empty
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;
  
  -- Find a unique username
  final_username := base_username;
  
  -- Keep trying until we find a unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || username_counter::text;
    username_counter := username_counter + 1;
  END LOOP;

  -- Insert the profile
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    username, 
    email, 
    industry,
    phone_number
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
    user_industry,
    user_phone
  );

  -- Ensure user has default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Auto-assign to RNS Tech Institute based on industry
  PERFORM public.auto_assign_user_to_institute(NEW.id, user_industry);

  RETURN NEW;
END;
$$;