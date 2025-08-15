-- Remove specified activities from Profile Building tab
DELETE FROM public.activity_point_settings 
WHERE category = 'resume' 
AND activity_name IN (
  'Education Added',
  'Experience Added', 
  'Personal Details Completed',
  'Professional Summary Completed',
  'Resume Saved',
  'Skills Added'
);