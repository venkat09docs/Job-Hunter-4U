-- Add plan_type field to distinguish between user and institute plans
ALTER TABLE public.subscription_plans 
ADD COLUMN plan_type TEXT DEFAULT 'user' CHECK (plan_type IN ('user', 'institute'));

-- Add member_limit field for institute plans
ALTER TABLE public.subscription_plans 
ADD COLUMN member_limit INTEGER;

-- Insert institute-specific subscription plans
INSERT INTO public.subscription_plans (name, description, duration_days, plan_type, member_limit, is_active) VALUES
('50 Members Pack', 'Institute plan supporting up to 50 members', 365, 'institute', 50, true),
('100 Members Pack', 'Institute plan supporting up to 100 members', 365, 'institute', 100, true),
('200 Members Pack', 'Institute plan supporting up to 200 members', 365, 'institute', 200, true),
('500 Members Pack', 'Institute plan supporting up to 500 members', 365, 'institute', 500, true),
('1000 Members Pack', 'Institute plan supporting up to 1000 members', 365, 'institute', 1000, true);

-- Update existing plans to be user plans
UPDATE public.subscription_plans 
SET plan_type = 'user' 
WHERE plan_type IS NULL OR plan_type = 'user';