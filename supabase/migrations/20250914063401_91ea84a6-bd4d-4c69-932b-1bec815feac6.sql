-- Create missing profile and user role for Venu (user ID: 76671fd5-3494-40e9-b9a1-778a291319bc)

-- Insert profile record
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