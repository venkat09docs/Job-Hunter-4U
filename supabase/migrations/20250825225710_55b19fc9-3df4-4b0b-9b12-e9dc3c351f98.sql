-- Remove incorrectly awarded Gold badge (Profile Perfectionist) from test user
-- User only completed 20% of digital profile tasks, not 100%
DELETE FROM public.profile_user_badges 
WHERE badge_id = '75c6bf52-ef28-4bcb-a49e-4aa4ce8eb2f8' 
  AND user_id = '2eb353a2-f3fd-4c88-b17f-6569e76d6154';