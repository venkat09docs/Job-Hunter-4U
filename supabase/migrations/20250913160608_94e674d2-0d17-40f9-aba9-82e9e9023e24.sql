-- First, manually assign Kent to RNS Tech Institute
-- Kent is an IT user, so assign to IT batch
INSERT INTO user_assignments (
  user_id,
  institute_id, 
  batch_id,
  assignment_type,
  assigned_by,
  is_active
) VALUES (
  '20e2d82b-ebe4-49c7-88d1-4463ff12b038', -- Kent's user_id
  '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80', -- RNS Tech Institute
  'acd2af9d-b906-4dc8-a250-fc5e47736e6a', -- IT Batch (since Kent's industry is IT)
  'manual_assignment',
  NULL, -- system assignment
  true
);

-- Create a trigger function to automatically assign new users to institutes
CREATE OR REPLACE FUNCTION public.auto_assign_new_user_to_institute()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_industry TEXT := 'Non-IT'; -- Default to Non-IT
  rns_institute_id UUID := '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80';
  it_batch_id UUID := 'acd2af9d-b906-4dc8-a250-fc5e47736e6a';
  non_it_batch_id UUID := '37bb5110-42d7-43ea-8854-b2bfee404dd8';
  target_batch_id UUID;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Auto-assigning new user % to institute', NEW.user_id;
  
  -- Get user's industry from profile
  SELECT industry INTO user_industry
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- If no industry found in profile, default to Non-IT
  IF user_industry IS NULL THEN
    user_industry := 'Non-IT';
  END IF;
  
  -- Determine batch based on industry
  target_batch_id := CASE 
    WHEN user_industry = 'IT' THEN it_batch_id 
    ELSE non_it_batch_id 
  END;
  
  -- Check if user is already assigned to any institute
  IF NOT EXISTS (
    SELECT 1 FROM public.user_assignments 
    WHERE user_id = NEW.user_id AND is_active = true
  ) THEN
    -- Auto-assign to RNS Tech Institute with appropriate batch
    INSERT INTO public.user_assignments (
      user_id,
      institute_id,
      batch_id,
      assignment_type,
      is_active
    ) VALUES (
      NEW.user_id,
      rns_institute_id,
      target_batch_id,
      'auto_signup',
      true
    );
    
    RAISE LOG 'User % successfully auto-assigned to RNS Tech Institute (% batch)', 
      NEW.user_id, user_industry;
  ELSE
    RAISE LOG 'User % already has institute assignment, skipping auto-assignment', NEW.user_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to auto-assign user % to institute: %', NEW.user_id, SQLERRM;
    RETURN NEW; -- Don't fail profile creation if assignment fails
END;
$$;

-- Create trigger that fires when a new profile is created
-- We trigger on profiles table rather than auth.users because:
-- 1. We can't modify auth schema triggers
-- 2. Profiles are created after auth.users via existing trigger
-- 3. We need profile data (like industry) for proper assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_institute ON public.profiles;

CREATE TRIGGER trigger_auto_assign_institute
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_new_user_to_institute();

-- Add comment for documentation
COMMENT ON FUNCTION public.auto_assign_new_user_to_institute() IS 
'Automatically assigns new users to RNS Tech Institute based on their industry. IT users go to IT batch, others go to Non-IT batch.';

COMMENT ON TRIGGER trigger_auto_assign_institute ON public.profiles IS 
'Triggers automatic institute assignment when a new user profile is created.';