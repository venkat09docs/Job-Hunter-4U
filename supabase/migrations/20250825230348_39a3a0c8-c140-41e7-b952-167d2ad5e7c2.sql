-- Remove all profile badges for test user and re-add only Bronze and Silver
-- Step 1: Remove all badges
DELETE FROM public.profile_user_badges 
WHERE user_id = '2eb353a2-f3fd-4c88-b17f-6569e76d6154';

-- Step 2: Re-add Bronze badge (Profile Rookie)
INSERT INTO public.profile_user_badges (user_id, badge_id, awarded_at, progress_data)
VALUES (
  '2eb353a2-f3fd-4c88-b17f-6569e76d6154',
  '6e5729f8-2238-43e3-982a-8c3ea4085cc2',
  NOW(),
  jsonb_build_object('completed_tasks', 1)
);

-- Step 3: Re-add Silver badge (Profile Complete)  
INSERT INTO public.profile_user_badges (user_id, badge_id, awarded_at, progress_data)
VALUES (
  '2eb353a2-f3fd-4c88-b17f-6569e76d6154',
  'bfcc4a87-8ce5-4c68-99dc-f602f41c2018',
  NOW(),
  jsonb_build_object('completed_tasks', 9)
);