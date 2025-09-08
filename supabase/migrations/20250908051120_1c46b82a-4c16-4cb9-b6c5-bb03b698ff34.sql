-- Add Plan A and Plan B from Career Level Up page to affiliate program
INSERT INTO public.affiliate_plan_commissions (plan_name, commission_rate, is_active, created_at, updated_at)
VALUES 
  ('Plan A: Course Only', 10.00, true, now(), now()),
  ('Plan B: Placement Package', 12.00, true, now(), now());