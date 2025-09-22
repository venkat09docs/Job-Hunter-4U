-- Clean up duplicate user assignments - simplified approach
-- First, deactivate older duplicate assignments (keep the most recent one per user)

UPDATE public.user_assignments 
SET is_active = false
WHERE id IN (
  SELECT ua.id
  FROM public.user_assignments ua
  INNER JOIN (
    SELECT user_id, MAX(assigned_at) as latest_assignment
    FROM public.user_assignments
    WHERE is_active = true
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) latest ON ua.user_id = latest.user_id
  WHERE ua.is_active = true 
    AND ua.assigned_at < latest.latest_assignment
);

-- Now add the unique constraint to prevent future duplicates
CREATE UNIQUE INDEX idx_user_assignments_single_active_per_user 
ON public.user_assignments (user_id) 
WHERE is_active = true;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_user_assignments_single_active_per_user 
IS 'Ensures that each user can only have one active assignment (prevents multiple institute assignments)';

-- Add a trigger to provide better error messages when constraint is violated
CREATE OR REPLACE FUNCTION public.prevent_multiple_institute_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has an active assignment (excluding current record for updates)
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM public.user_assignments 
      WHERE user_id = NEW.user_id 
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Student cannot be assigned to multiple institutes. User already has an active assignment.';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_active = true AND EXISTS (
      SELECT 1 FROM public.user_assignments 
      WHERE user_id = NEW.user_id 
        AND is_active = true 
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Student cannot be assigned to multiple institutes. User already has an active assignment.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_multiple_assignments_trigger
  BEFORE INSERT OR UPDATE ON public.user_assignments
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.prevent_multiple_institute_assignments();