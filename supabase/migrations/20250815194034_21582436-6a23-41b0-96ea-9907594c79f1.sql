-- Insert Profile Building activities into activity_point_settings
INSERT INTO public.activity_point_settings (
  activity_id,
  activity_name,
  description,
  category,
  activity_type,
  points,
  is_active
) VALUES
  (
    'resume_completion_80',
    'Resume completes at least 80%',
    'Points awarded when user''s resume reaches 80% completion status',
    'resume',
    'completion_milestone',
    10,
    true
  ),
  (
    'linkedin_profile_completion_80',
    'LinkedIn Profile completes at least 80%',
    'Points awarded when user''s LinkedIn profile reaches 80% completion status',
    'resume',
    'completion_milestone',
    10,
    true
  ),
  (
    'github_profile_completion_80',
    'GitHub Profile completes at least 80%',
    'Points awarded when user''s GitHub profile reaches 80% completion status',
    'resume',
    'completion_milestone',
    10,
    true
  ),
  (
    'cover_letter_saved_resources',
    'Cover Letter Saved to Resources Library',
    'Points awarded when user saves a cover letter to the resources library',
    'resume',
    'resource_save',
    5,
    true
  ),
  (
    'resume_saved_resources',
    'Resume Saved to Resources Library',
    'Points awarded when user saves a resume to the resources library',
    'resume',
    'resource_save',
    5,
    true
  ),
  (
    'readme_saved_resources',
    'README.md file Saved to Resources Library',
    'Points awarded when user saves a README.md file to the resources library',
    'resume',
    'resource_save',
    3,
    true
  )
ON CONFLICT (activity_id) DO UPDATE SET
  activity_name = EXCLUDED.activity_name,
  description = EXCLUDED.description,
  points = EXCLUDED.points,
  is_active = EXCLUDED.is_active,
  updated_at = now();