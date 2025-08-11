-- Reset LinkedIn network metrics for August 13th (Wednesday) to 0
UPDATE linkedin_network_metrics 
SET value = 0, updated_at = now()
WHERE user_id = '2eb353a2-f3fd-4c88-b17f-6569e76d6154' 
  AND date = '2025-08-13';