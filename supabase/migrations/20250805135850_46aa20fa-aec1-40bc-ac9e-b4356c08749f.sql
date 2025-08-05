-- Add subscription_plan column to institutes table
ALTER TABLE public.institutes 
ADD COLUMN subscription_plan TEXT,
ADD COLUMN subscription_start_date TIMESTAMPTZ,
ADD COLUMN subscription_end_date TIMESTAMPTZ,
ADD COLUMN subscription_active BOOLEAN DEFAULT false;

-- Function to automatically activate subscription for institute users
CREATE OR REPLACE FUNCTION public.assign_institute_subscription_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  institute_sub_plan TEXT;
  institute_sub_start TIMESTAMPTZ;
  institute_sub_end TIMESTAMPTZ;
  institute_sub_active BOOLEAN;
BEGIN
  -- Get institute subscription details
  SELECT subscription_plan, subscription_start_date, subscription_end_date, subscription_active
  INTO institute_sub_plan, institute_sub_start, institute_sub_end, institute_sub_active
  FROM public.institutes
  WHERE id = NEW.institute_id;
  
  -- If institute has active subscription, assign to user profile
  IF institute_sub_active AND institute_sub_plan IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      subscription_plan = institute_sub_plan,
      subscription_start_date = institute_sub_start,
      subscription_end_date = institute_sub_end,
      subscription_active = true,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for user assignments
CREATE TRIGGER assign_institute_subscription_trigger
  AFTER INSERT ON public.user_assignments
  FOR EACH ROW
  WHEN (NEW.assignment_type = 'student')
  EXECUTE FUNCTION assign_institute_subscription_to_user();