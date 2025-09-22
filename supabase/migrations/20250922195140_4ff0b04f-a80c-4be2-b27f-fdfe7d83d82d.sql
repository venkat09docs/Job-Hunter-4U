-- Clean up duplicate user assignments before adding constraint
-- Keep the most recent assignment for each user and deactivate older ones

WITH user_assignment_ranked AS (
  SELECT 
    id,
    user_id,
    institute_id,
    assigned_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY assigned_at DESC) as rn
  FROM public.user_assignments 
  WHERE is_active = true
),
assignments_to_deactivate AS (
  SELECT id 
  FROM user_assignment_ranked 
  WHERE rn > 1
)
UPDATE public.user_assignments 
SET is_active = false, 
    updated_at = now()
WHERE id IN (SELECT id FROM assignments_to_deactivate);

-- Log the cleanup action
INSERT INTO public.audit_log (table_name, action, user_id, timestamp)
SELECT 
  'user_assignments',
  'CLEANUP: Deactivated duplicate institute assignment', 
  user_id,
  now()
FROM public.user_assignments 
WHERE is_active = false 
  AND updated_at > now() - INTERVAL '1 minute';

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