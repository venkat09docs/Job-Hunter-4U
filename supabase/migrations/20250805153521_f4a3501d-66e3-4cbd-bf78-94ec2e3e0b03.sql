-- Remove the dummy 1000 Members Pack that has no pricing data
DELETE FROM public.subscription_plans 
WHERE name = '1000 Members Pack' AND plan_type = 'institute' AND price_paisa = 0;