-- Properly remove the Gold badge from test user
-- The user should only have Bronze and Silver badges
DELETE FROM public.profile_user_badges 
WHERE user_id = '2eb353a2-f3fd-4c88-b17f-6569e76d6154' 
  AND badge_id = '75c6bf52-ef28-4bcb-a49e-4aa4ce8eb2f8';