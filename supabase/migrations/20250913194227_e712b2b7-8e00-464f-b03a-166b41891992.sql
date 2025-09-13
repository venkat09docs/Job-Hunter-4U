-- Fix the auto-assign trigger to use the RNS Tech Institute admin as assigned_by
-- instead of self-assignment which causes constraint violations

CREATE OR REPLACE FUNCTION public.auto_assign_new_user_to_institute()
RETURNS TRIGGER AS $$
DECLARE
  user_industry TEXT := 'Non-IT'; -- Default to Non-IT
  rns_institute_id UUID := '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80';
  it_batch_id UUID := 'acd2af9d-b906-4dc8-a250-fc5e47736e6a';
  non_it_batch_id UUID := '37bb5110-42d7-43ea-8854-b2bfee404dd8';
  rns_institute_admin_id UUID := 'ec2027a6-4486-4feb-bc7b-bd0c6631ca57'; -- g.venkat09 - RNS Tech Institute Admin
  target_batch_id UUID;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Auto-assigning new user % to institute', NEW.user_id;
  
  -- Get user's industry from profile (it's available in NEW since this is AFTER INSERT)
  user_industry := COALESCE(NEW.industry, 'Non-IT');
  
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
      assigned_by,
      is_active
    ) VALUES (
      NEW.user_id,
      rns_institute_id,
      target_batch_id,
      'institute', -- Valid assignment type
      rns_institute_admin_id, -- Use RNS Tech Institute admin instead of self-assignment
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;