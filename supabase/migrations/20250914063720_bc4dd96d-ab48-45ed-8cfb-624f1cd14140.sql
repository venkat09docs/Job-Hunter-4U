-- Completely disable the problematic trigger and create Venu's profile manually
-- Drop the problematic trigger completely for now
DROP TRIGGER IF EXISTS assign_new_users_to_rns_tech_trigger ON public.profiles;

-- Also drop the function to prevent it from being called elsewhere
DROP FUNCTION IF EXISTS public.assign_new_users_to_rns_tech();

-- Now insert the profile record for Venu directly
INSERT INTO public.profiles (user_id, full_name, username, email, industry, created_at, updated_at)
VALUES (
  '76671fd5-3494-40e9-b9a1-778a291319bc',
  'venu',
  'venu', 
  'test15@gmail.com',
  'IT',
  '2025-09-14 06:31:41.227855+00',  -- Use the actual signup time from auth logs
  '2025-09-14 06:31:41.227855+00'
);

-- Insert default user role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  '76671fd5-3494-40e9-b9a1-778a291319bc',
  'user'::app_role
);

-- Create affiliate account for the user
INSERT INTO public.affiliate_users (user_id, affiliate_code, is_eligible, total_earnings, total_referrals)
VALUES (
  '76671fd5-3494-40e9-b9a1-778a291319bc',
  substring(md5('test15@gmail.com' || '76671fd5-3494-40e9-b9a1-778a291319bc'), 1, 8),
  true,
  0,
  0
);