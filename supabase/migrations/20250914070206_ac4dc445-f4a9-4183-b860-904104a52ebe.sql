-- Add assigned_by column to user_assignments table
ALTER TABLE public.user_assignments 
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id);

-- Create function to get top institute admin or fallback to super admin
CREATE OR REPLACE FUNCTION public.get_assigner_for_institute(institute_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  institute_admin_id uuid;
  super_admin_id uuid;
BEGIN
  -- Try to get the first (top) institute admin for this institute
  SELECT iaa.user_id INTO institute_admin_id
  FROM public.institute_admin_assignments iaa
  WHERE iaa.institute_id = institute_id_param 
    AND iaa.is_active = true
  ORDER BY iaa.created_at ASC -- First assigned admin
  LIMIT 1;
  
  -- If institute admin found, return that
  IF institute_admin_id IS NOT NULL THEN
    RETURN institute_admin_id;
  END IF;
  
  -- Otherwise, get any super admin as fallback
  SELECT ur.user_id INTO super_admin_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role
  ORDER BY ur.user_id -- Consistent ordering
  LIMIT 1;
  
  RETURN super_admin_id;
END;
$$;

-- Create the user signup handler function
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rns_tech_institute_id uuid;
  it_batch_id uuid;
  non_it_batch_id uuid;
  selected_batch_id uuid;
  user_industry text;
  affiliate_code text;
  assigner_user_id uuid;
BEGIN
  -- Create profile first
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    username, 
    email, 
    industry
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'Display Name',
      split_part(NEW.email, '@', 1)
    ),
    lower(regexp_replace(
      COALESCE(
        NEW.raw_user_meta_data ->> 'username',
        NEW.raw_user_meta_data ->> 'full_name', 
        NEW.raw_user_meta_data ->> 'Display Name',
        split_part(NEW.email, '@', 1)
      ), '[^a-zA-Z0-9]', '', 'g'
    )) || substring(md5(NEW.id::text), 1, 4),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT')
  );

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create affiliate account
  SELECT substring(md5(NEW.email || NEW.id::text), 1, 8) INTO affiliate_code;
  INSERT INTO public.affiliate_users (
    user_id,
    affiliate_code,
    is_eligible,
    total_earnings,
    total_referrals
  ) VALUES (
    NEW.id,
    affiliate_code,
    true,
    0,
    0
  );

  -- Get RNS Tech institute and batches
  SELECT id INTO rns_tech_institute_id
  FROM public.institutes
  WHERE UPPER(name) = 'RNS TECH' AND is_active = true
  LIMIT 1;

  IF rns_tech_institute_id IS NOT NULL THEN
    -- Get IT and Non-IT batch IDs
    SELECT id INTO it_batch_id
    FROM public.batches
    WHERE institute_id = rns_tech_institute_id 
      AND UPPER(name) = 'IT' 
      AND is_active = true
    LIMIT 1;

    SELECT id INTO non_it_batch_id
    FROM public.batches
    WHERE institute_id = rns_tech_institute_id 
      AND UPPER(name) = 'NON-IT' 
      AND is_active = true
    LIMIT 1;

    -- Get user's industry preference
    user_industry := COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT');
    
    -- Select appropriate batch
    IF user_industry = 'IT' AND it_batch_id IS NOT NULL THEN
      selected_batch_id := it_batch_id;
    ELSIF user_industry = 'Non-IT' AND non_it_batch_id IS NOT NULL THEN
      selected_batch_id := non_it_batch_id;
    ELSIF it_batch_id IS NOT NULL THEN
      selected_batch_id := it_batch_id; -- Default fallback
    END IF;

    -- Get the appropriate assigner
    SELECT public.get_assigner_for_institute(rns_tech_institute_id) INTO assigner_user_id;

    -- Assign user to RNS Tech institute and batch
    IF selected_batch_id IS NOT NULL THEN
      INSERT INTO public.user_assignments (
        user_id,
        institute_id,
        batch_id,
        assignment_type,
        assigned_by,
        is_active
      ) VALUES (
        NEW.id,
        rns_tech_institute_id,
        selected_batch_id,
        'student',
        assigner_user_id,
        true
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user_signup: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_auto_assign ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_assign
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();