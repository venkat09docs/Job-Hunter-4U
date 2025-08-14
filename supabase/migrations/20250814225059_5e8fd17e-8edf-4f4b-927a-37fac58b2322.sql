-- Update Institute Membership Plans pricing
-- Convert rupees to paisa (multiply by 100)

-- 50 Members Pack: Actual ₹2,00,000, Discount ₹1,75,000
UPDATE subscription_plans 
SET 
  original_price_paisa = 20000000, -- ₹2,00,000 in paisa
  price_paisa = 17500000,          -- ₹1,75,000 in paisa
  discount_per_member = (20000000 - 17500000) / 50, -- ₹500 per member discount
  updated_at = now()
WHERE plan_type = 'institute' 
  AND name = '50 Members Pack'
  AND is_active = true;

-- 100 Members Pack: Actual ₹4,00,000, Discount ₹3,25,000
UPDATE subscription_plans 
SET 
  original_price_paisa = 40000000, -- ₹4,00,000 in paisa
  price_paisa = 32500000,          -- ₹3,25,000 in paisa
  discount_per_member = (40000000 - 32500000) / 100, -- ₹750 per member discount
  updated_at = now()
WHERE plan_type = 'institute' 
  AND name = '100 Members Pack'
  AND is_active = true;

-- 200 Members Pack: Actual ₹8,00,000, Discount ₹6,00,000
UPDATE subscription_plans 
SET 
  original_price_paisa = 80000000, -- ₹8,00,000 in paisa
  price_paisa = 60000000,          -- ₹6,00,000 in paisa
  discount_per_member = (80000000 - 60000000) / 200, -- ₹1000 per member discount
  updated_at = now()
WHERE plan_type = 'institute' 
  AND name = '200 Members Pack'
  AND is_active = true;

-- 500 Members Pack: Actual ₹20,00,000, Discount ₹12,50,000
UPDATE subscription_plans 
SET 
  original_price_paisa = 200000000, -- ₹20,00,000 in paisa
  price_paisa = 125000000,          -- ₹12,50,000 in paisa
  discount_per_member = (200000000 - 125000000) / 500, -- ₹1500 per member discount
  updated_at = now()
WHERE plan_type = 'institute' 
  AND name = '500 Members Pack'
  AND is_active = true;