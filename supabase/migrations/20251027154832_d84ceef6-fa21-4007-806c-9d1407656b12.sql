-- Add new subscription plans to affiliate_plan_commissions table
INSERT INTO affiliate_plan_commissions (plan_name, commission_rate, is_active)
VALUES 
  ('Quick 10 Days Access', 10.0, true),
  ('One Year Plan without Digital Profile', 15.0, true),
  ('One Year Plan with Digital Profile', 20.0, true)
ON CONFLICT (plan_name) DO NOTHING;