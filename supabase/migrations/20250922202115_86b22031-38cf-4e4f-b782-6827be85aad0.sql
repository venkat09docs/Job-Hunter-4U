-- Modify the auto-assignment function to skip RNS Tech assignment when user is created by institute admin
-- We'll use a metadata flag to detect when user is created by institute admin vs regular signup

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_username TEXT;
  username_counter INTEGER := 1;
  final_username TEXT;
  user_industry TEXT := 'IT';
  rns_institute_id UUID := '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80';
  it_batch_id UUID := 'acd2af9d-b906-4dc8-a250-fc5e47736e6a';
  non_it_batch_id UUID := '37bb5110-42d7-43ea-8854-b2bfee404dd8';
  selected_batch_id UUID;
  institute_admin_id UUID;
  super_admin_id UUID := '465d4d04-30a4-41ef-9b36-14c3debbdcc8';
  skip_auto_assignment BOOLEAN := FALSE;
BEGIN
  -- Check if this user creation is from institute admin (skip auto RNS Tech assignment)
  IF NEW.raw_user_meta_data->>'created_by_institute_admin' = 'true' THEN
    skip_auto_assignment := TRUE;
    RAISE LOG 'Skipping RNS Tech auto-assignment for user % (created by institute admin)', NEW.id;
  END IF;

  -- Extract industry from metadata
  IF NEW.raw_user_meta_data->>'industry' IS NOT NULL THEN
    user_industry := NEW.raw_user_meta_data->>'industry';
  END IF;
  
  -- Generate clean username from metadata
  clean_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'Display Name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Clean username: remove non-alphanumeric chars and make lowercase  
  clean_username := lower(regexp_replace(clean_username, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure username is not empty
  IF clean_username = '' OR clean_username IS NULL THEN
    clean_username := 'user';
  END IF;
  
  -- Find a unique username
  final_username := clean_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := clean_username || username_counter::text;
    username_counter := username_counter + 1;
  END LOOP;

  -- Create profile
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    username, 
    email, 
    industry,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'Display Name',
      final_username
    ),
    final_username,
    NEW.email,
    user_industry,
    NOW(),
    NOW()
  );

  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);

  -- Create affiliate account
  INSERT INTO public.affiliate_users (
    user_id, 
    affiliate_code, 
    is_eligible, 
    total_earnings, 
    total_referrals
  ) VALUES (
    NEW.id,
    substring(md5(NEW.email || NEW.id::text), 1, 8),
    true,
    0,
    0
  );

  -- Only auto-assign to RNS Tech Institute for regular signups (not institute admin created users)
  IF NOT skip_auto_assignment THEN
    RAISE LOG 'Auto-assigning new user % to RNS Tech Institute', NEW.id;
    
    -- Select appropriate batch based on industry
    IF user_industry = 'IT' THEN
      selected_batch_id := it_batch_id;
    ELSE
      selected_batch_id := non_it_batch_id;
    END IF;
    
    -- Get first available institute admin for RNS Tech
    SELECT iaa.user_id INTO institute_admin_id
    FROM institute_admin_assignments iaa
    WHERE iaa.institute_id = rns_institute_id 
      AND iaa.is_active = true
    ORDER BY iaa.created_at ASC
    LIMIT 1;
    
    -- Use super admin if no institute admin available
    IF institute_admin_id IS NULL THEN
      institute_admin_id := super_admin_id;
    END IF;
    
    -- Insert user assignment
    INSERT INTO public.user_assignments (
      user_id,
      institute_id, 
      batch_id,
      assignment_type,
      assigned_by,
      is_active
    ) VALUES (
      NEW.id,
      rns_institute_id,
      selected_batch_id,
      'auto_signup',
      institute_admin_id,
      true
    );
    
    RAISE LOG 'User % successfully auto-assigned to RNS Tech Institute (% batch)', NEW.id, user_industry;
  ELSE
    RAISE LOG 'User % will be assigned to institute by admin manually', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in auto-assignment for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;