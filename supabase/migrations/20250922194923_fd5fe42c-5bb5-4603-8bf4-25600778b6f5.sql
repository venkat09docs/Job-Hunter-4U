-- Add unique constraint to prevent students from being assigned to multiple institutes
-- This constraint ensures one active assignment per user across all institutes

-- First, let's add a unique constraint to prevent multiple active assignments per user
CREATE UNIQUE INDEX CONCURRENTLY idx_user_assignments_single_active_per_user 
ON public.user_assignments (user_id) 
WHERE is_active = true;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_user_assignments_single_active_per_user 
IS 'Ensures that each user can only have one active assignment (prevents multiple institute assignments)';

-- Add a trigger to log when someone tries to violate this constraint
CREATE OR REPLACE FUNCTION public.prevent_multiple_institute_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has an active assignment
  IF EXISTS (
    SELECT 1 FROM public.user_assignments 
    WHERE user_id = NEW.user_id 
      AND is_active = true 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Student cannot be assigned to multiple institutes. User already has an active assignment.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_multiple_assignments_trigger
  BEFORE INSERT OR UPDATE ON public.user_assignments
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.prevent_multiple_institute_assignments();