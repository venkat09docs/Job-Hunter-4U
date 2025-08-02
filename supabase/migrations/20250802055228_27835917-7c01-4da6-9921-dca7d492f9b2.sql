-- Update existing plan names to match frontend and add 1 Year Plan
UPDATE public.subscription_plans 
SET name = '3 Months Plan', description = 'Access for 3 months'
WHERE name = 'Three Month Plan';

-- Insert 1 Year Plan
INSERT INTO public.subscription_plans (name, description, duration_days, is_active)
VALUES ('1 Year Plan', 'Access for 1 year', 365, true);