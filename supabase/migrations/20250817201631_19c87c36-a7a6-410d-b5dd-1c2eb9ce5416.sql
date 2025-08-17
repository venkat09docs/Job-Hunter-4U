INSERT INTO public.subscription_plans 
(name, duration_days, plan_type, is_active, description, price_paisa, original_price_paisa, is_popular, discount_per_member, features, member_limit)
VALUES 
('6 Months Plan', 180, 'user', true, 'Access for 6 months', 699900, 0, false, 0, '[]'::jsonb, null);