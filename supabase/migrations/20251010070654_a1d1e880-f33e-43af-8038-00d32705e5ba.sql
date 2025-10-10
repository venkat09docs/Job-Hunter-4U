-- Remove one week subscription plan
DELETE FROM subscription_plans 
WHERE name = 'One Week Plan' OR duration_days = 7;