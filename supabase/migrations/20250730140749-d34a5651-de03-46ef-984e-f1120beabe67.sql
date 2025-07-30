-- Add unique constraint on user_id to ensure one resume per user
-- and update the primary key constraint to support upsert operations

-- First, remove duplicate records keeping only the latest one per user
DELETE FROM public.resume_data 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM public.resume_data 
  ORDER BY user_id, updated_at DESC
);

-- Add unique constraint on user_id 
ALTER TABLE public.resume_data 
ADD CONSTRAINT resume_data_user_id_unique UNIQUE (user_id);

-- Create or replace the upsert function for better data handling
CREATE OR REPLACE FUNCTION public.upsert_resume_data(
  p_user_id UUID,
  p_personal_details JSONB,
  p_experience JSONB,
  p_education JSONB,
  p_skills_interests JSONB,
  p_certifications_awards JSONB,
  p_professional_summary TEXT,
  p_status TEXT
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
    professional_summary = EXCLUDED.professional_summary,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;