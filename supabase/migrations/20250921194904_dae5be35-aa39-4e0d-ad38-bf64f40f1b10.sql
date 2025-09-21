-- Add unique constraint to prevent duplicate points for the same activity
ALTER TABLE public.user_activity_points 
ADD CONSTRAINT unique_user_activity_date 
UNIQUE (user_id, activity_id, activity_date);