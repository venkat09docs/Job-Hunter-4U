-- Temporarily disable the auto-assignment trigger and create Venu's profile
-- First, drop the trigger temporarily
DROP TRIGGER IF EXISTS assign_new_users_to_rns_tech_trigger ON public.profiles;

-- Create missing profile and user role for Venu
INSERT INTO public.profiles (user_id, full_name, username, email, industry)
VALUES (
  '76671fd5-3494-40e9-b9a1-778a291319bc',
  'venu',
  'venu',
  'test15@gmail.com',
  'IT'
);

-- Insert default user role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  '76671fd5-3494-40e9-b9a1-778a291319bc',
  'user'::app_role
);

-- Re-enable the trigger but fix the function to handle assigned_by properly
CREATE OR REPLACE FUNCTION public.assign_new_users_to_rns_tech()
RETURNS TRIGGER AS $$
DECLARE
  rns_institute_id UUID;
  it_batch_id UUID;
  system_admin_id UUID;
BEGIN
  -- Get the first admin user as the assigner
  SELECT user_id INTO system_admin_id
  FROM public.user_roles
  WHERE role = 'admin'::app_role
  LIMIT 1;

  -- If no admin exists, use the new user themselves as the assigner
  IF system_admin_id IS NULL THEN
    system_admin_id := NEW.user_id;
  END IF;

  -- Get RNS Tech institute
  SELECT id INTO rns_institute_id FROM public.institutes WHERE code = 'RNS_TECH' LIMIT 1;
  
  -- Get IT batch
  SELECT id INTO it_batch_id FROM public.batches WHERE code = 'IT' AND institute_id = rns_institute_id LIMIT 1;
  
  -- Only proceed if both institute and batch exist
  IF rns_institute_id IS NOT NULL AND it_batch_id IS NOT NULL THEN
    INSERT INTO user_assignments (
      user_id,
      institute_id,
      batch_id,
      assignment_type,
      assigned_by,
      is_active,
      assigned_at
    ) VALUES (
      NEW.user_id,
      rns_institute_id,
      it_batch_id,
      'batch',
      system_admin_id, -- Now properly set
      true,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger
CREATE TRIGGER assign_new_users_to_rns_tech_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_new_users_to_rns_tech();