-- Add pricing columns to subscription_plans table for institute plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS price_paisa INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price_paisa INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_per_member INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Update existing institute plans with pricing from the hardcoded plans
UPDATE public.subscription_plans 
SET 
  price_paisa = 11250000,
  original_price_paisa = 12500000,
  discount_per_member = 250,
  duration_days = 90,
  features = '[
    "50 Student Accounts",
    "3 Months Access", 
    "Full Dashboard Access",
    "Progress Tracking",
    "Report Generation",
    "Email Support"
  ]'::jsonb
WHERE name = '50 Members Pack' AND plan_type = 'institute';

UPDATE public.subscription_plans 
SET 
  price_paisa = 20000000,
  original_price_paisa = 25000000,
  discount_per_member = 500,
  duration_days = 90,
  features = '[
    "100 Student Accounts",
    "3 Months Access",
    "Full Dashboard Access", 
    "Progress Tracking",
    "Report Generation",
    "Priority Email Support",
    "Bulk User Management"
  ]'::jsonb
WHERE name = '100 Members Pack' AND plan_type = 'institute';

UPDATE public.subscription_plans 
SET 
  price_paisa = 35000000,
  original_price_paisa = 50000000,
  discount_per_member = 750,
  duration_days = 90,
  features = '[
    "200 Student Accounts",
    "3 Months Access",
    "Full Dashboard Access",
    "Progress Tracking", 
    "Report Generation",
    "Priority Email Support",
    "Bulk User Management",
    "Custom Reports"
  ]'::jsonb
WHERE name = '200 Members Pack' AND plan_type = 'institute';

UPDATE public.subscription_plans 
SET 
  price_paisa = 75000000,
  original_price_paisa = 125000000,
  discount_per_member = 1000,
  duration_days = 90,
  features = '[
    "500 Student Accounts",
    "3 Months Access",
    "Full Dashboard Access",
    "Progress Tracking",
    "Report Generation", 
    "24/7 Phone Support",
    "Bulk User Management",
    "Custom Reports",
    "Dedicated Account Manager"
  ]'::jsonb
WHERE name = '500 Members Pack' AND plan_type = 'institute';

-- Add a popular flag column
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- Mark 100 Members Pack as popular
UPDATE public.subscription_plans 
SET is_popular = true 
WHERE name = '100 Members Pack' AND plan_type = 'institute';