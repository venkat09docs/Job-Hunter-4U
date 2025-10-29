-- Update Quick 10 Days Access Plan price from 299 to 599 rupees
UPDATE subscription_plans 
SET 
  price_paisa = 59900,
  original_price_paisa = 59900,
  updated_at = now()
WHERE name = 'Quick 10 Days Access';