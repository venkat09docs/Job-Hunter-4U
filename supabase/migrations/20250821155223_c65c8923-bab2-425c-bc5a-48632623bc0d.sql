-- Remove LinkedIn Growth activity point settings
DELETE FROM public.activity_point_settings 
WHERE category = 'LinkedIn Growth';

-- Remove Profile Building activity point settings (if any exist)
DELETE FROM public.activity_point_settings 
WHERE category = 'Profile Building';

-- Remove any existing user activity points for these categories
DELETE FROM public.user_activity_points 
WHERE activity_id IN (
  SELECT activity_id 
  FROM public.activity_point_settings 
  WHERE category IN ('LinkedIn Growth', 'Profile Building')
);