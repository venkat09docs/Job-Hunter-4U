-- Add separate awards column to resume_data table
ALTER TABLE public.resume_data 
ADD COLUMN awards jsonb DEFAULT '[]'::jsonb;

-- Update the upsert_resume_data function to handle awards separately
CREATE OR REPLACE FUNCTION public.upsert_resume_data(
  p_user_id UUID,
  p_personal_details JSONB,
  p_experience JSONB,
  p_education JSONB,
  p_skills_interests JSONB,
  p_certifications_awards JSONB DEFAULT '[]'::jsonb,
  p_awards JSONB DEFAULT '[]'::jsonb,
  p_professional_summary TEXT DEFAULT '',
  p_status TEXT DEFAULT 'draft'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO public.resume_data (
    user_id,
    personal_details,
    experience,
    education,
    skills_interests,
    certifications_awards,
    awards,
    professional_summary,
    status,
    updated_at
  ) VALUES (
    p_user_id,
    p_personal_details,
    p_experience,
    p_education,
    p_skills_interests,
    p_certifications_awards,
    p_awards,
    p_professional_summary,
    p_status,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    personal_details = EXCLUDED.personal_details,
    experience = EXCLUDED.experience,
    education = EXCLUDED.education,
    skills_interests = EXCLUDED.skills_interests,
    certifications_awards = EXCLUDED.certifications_awards,
    awards = EXCLUDED.awards,
    professional_summary = EXCLUDED.professional_summary,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;