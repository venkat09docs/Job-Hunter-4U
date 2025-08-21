-- First, modify the category constraint to include resume-related categories
ALTER TABLE public.career_task_templates 
DROP CONSTRAINT IF EXISTS career_task_templates_category_check;

ALTER TABLE public.career_task_templates 
ADD CONSTRAINT career_task_templates_category_check 
CHECK (category = ANY (ARRAY[
  'linkedin_growth'::text, 
  'supabase_practice'::text, 
  'n8n_practice'::text, 
  'networking'::text, 
  'content_creation'::text,
  'resume_building'::text,
  'resume_optimization'::text,
  'resume_management'::text,
  'cover_letter'::text
]));

-- Also modify the difficulty constraint to use the correct values
ALTER TABLE public.career_task_templates 
DROP CONSTRAINT IF EXISTS career_task_templates_difficulty_check;

ALTER TABLE public.career_task_templates 
ADD CONSTRAINT career_task_templates_difficulty_check 
CHECK (difficulty = ANY (ARRAY[
  'beginner'::text, 
  'intermediate'::text, 
  'advanced'::text,
  'easy'::text,
  'medium'::text,
  'hard'::text
]));

-- Now insert the 9 Resume Task Templates
INSERT INTO public.career_task_templates (
  code,
  module,
  title,
  description,
  category,
  evidence_types,
  points_reward,
  cadence,
  difficulty,
  estimated_duration,
  instructions,
  verification_criteria,
  bonus_rules,
  is_active
) VALUES 
  (
    'RESUME_PROFESSIONAL_LINKS',
    'RESUME',
    'Add Professional Links Section (8 pts)',
    'Include LinkedIn, GitHub, and portfolio links',
    'resume_building',
    ARRAY['url', 'screenshot', 'file'],
    8,
    'oneoff',
    'easy',
    15,
    '{"steps": ["Add a Professional Links section to your resume", "Include your LinkedIn profile URL", "Add your GitHub profile URL", "Include portfolio website URL if available", "Ensure all links are working and professional"], "requirements": ["LinkedIn URL must be complete profile", "GitHub URL should show active repositories", "All links must be functional"]}',
    '{"validation_rules": ["Must contain LinkedIn URL", "Must contain GitHub URL", "Links should be properly formatted", "Resume must show clear Professional Links section"], "evidence_required": ["Screenshot of resume with links section", "URL to updated resume"]}',
    '{}',
    true
  ),
  (
    'RESUME_TOP_6_SKILLS',
    'RESUME',
    'Generate top 6 skills as per Your Role (10 pts)',
    'Use the AI Powered Career Tool - Resume Builder Top 6 Skills',
    'resume_building',
    ARRAY['screenshot', 'file', 'data_export'],
    10,
    'oneoff',
    'medium',
    20,
    '{"steps": ["Navigate to AI Powered Career Tools", "Use Resume Builder - Top 6 Skills tool", "Enter your target role/position", "Generate skills using AI", "Add the generated skills to your resume"], "ai_tool": "Resume Builder - Top 6 Skills", "requirements": ["Use the AI tool to generate skills", "Skills must be relevant to target role", "Add all 6 skills to resume"]}',
    '{"validation_rules": ["Must use AI tool for skill generation", "Resume must contain 6 relevant skills", "Skills should match target role"], "evidence_required": ["Screenshot from AI tool showing generated skills", "Updated resume with skills section"]}',
    '{"ai_tool_bonus": 2}',
    true
  ),
  (
    'RESUME_ACHIEVEMENTS_RESPONSIBILITIES',
    'RESUME',
    'Generate Achievements or Roles and Responsibilities (10 pts)',
    'Use the AI Powered Career Tool - Resume Builder Achievements',
    'resume_building',
    ARRAY['screenshot', 'file', 'data_export'],
    10,
    'oneoff',
    'medium',
    25,
    '{"steps": ["Access AI Powered Career Tools", "Use Resume Builder - Achievements tool", "Input your work experience details", "Generate achievements and responsibilities", "Update your resume with generated content"], "ai_tool": "Resume Builder - Achievements", "requirements": ["Use AI tool for content generation", "Include quantifiable achievements", "Update resume with generated content"]}',
    '{"validation_rules": ["Must use AI tool for generation", "Resume must show updated achievements/responsibilities", "Content should be quantifiable and impactful"], "evidence_required": ["Screenshot from AI tool", "Updated resume section showing new content"]}',
    '{"ai_tool_bonus": 2}',
    true
  ),
  (
    'RESUME_SUMMARY_GENERATION',
    'RESUME',
    'Generate Resume Summary (10 pts)',
    'Use the AI Powered Career Tool - Generate Resume Summary',
    'resume_building',
    ARRAY['screenshot', 'file', 'data_export'],
    10,
    'oneoff',
    'medium',
    20,
    '{"steps": ["Navigate to AI Powered Career Tools", "Use Generate Resume Summary tool", "Input your background and target role", "Generate professional summary", "Add summary to top of your resume"], "ai_tool": "Generate Resume Summary", "requirements": ["Use AI tool for summary generation", "Summary must be 3-4 sentences", "Include key qualifications and career goals"]}',
    '{"validation_rules": ["Must use AI tool for generation", "Resume must have professional summary at top", "Summary should be compelling and relevant"], "evidence_required": ["Screenshot from AI tool showing generated summary", "Updated resume with summary section"]}',
    '{"ai_tool_bonus": 2}',
    true
  ),
  (
    'RESUME_COMPLETE_PROFILE',
    'RESUME',
    'Complete Resume Profile Information (8 pts)',
    'Ensure all essential resume sections are completed with professional information',
    'resume_building',
    ARRAY['screenshot', 'file'],
    8,
    'oneoff',
    'easy',
    20,
    '{"steps": ["Complete contact information section", "Add professional email and phone", "Include city and state/country", "Ensure consistent formatting", "Review for accuracy and completeness"], "requirements": ["All contact details must be professional", "Information must be current and accurate", "Consistent formatting throughout"]}',
    '{"validation_rules": ["Contact section must be complete", "Professional email address required", "No missing essential information"], "evidence_required": ["Screenshot or file of completed resume"]}',
    '{}',
    true
  ),
  (
    'RESUME_EDUCATION_CERTIFICATIONS',
    'RESUME',
    'Add Educational, Certification, Awards details (10 pts)',
    'Complete your resume with comprehensive educational background and achievements',
    'resume_building',
    ARRAY['screenshot', 'file'],
    10,
    'oneoff',
    'easy',
    20,
    '{"steps": ["Add Education section with degrees and institutions", "Include relevant certifications", "Add any awards or honors received", "Include graduation dates and GPAs if strong", "Ensure proper formatting and completeness"], "requirements": ["Education section must be complete", "Include relevant certifications", "Add any notable awards or achievements"]}',
    '{"validation_rules": ["Resume must have complete Education section", "Certifications should be relevant to career", "Proper formatting and dates included"], "evidence_required": ["Screenshot or file of updated resume section"]}',
    '{}',
    true
  ),
  (
    'RESUME_ATS_BASELINE_SCORE',
    'RESUME',
    'Pass Baseline ATS Score (10 pts)',
    'Use the AI Powered Career Tool - Resume Score Tracking to meet ATS requirements',
    'resume_optimization',
    ARRAY['screenshot', 'data_export'],
    10,
    'oneoff',
    'medium',
    30,
    '{"steps": ["Upload resume to Resume Score Tracking tool", "Analyze ATS compatibility score", "Review recommendations for improvement", "Make necessary adjustments", "Re-test until baseline score is achieved"], "ai_tool": "Resume Score Tracking", "requirements": ["Achieve minimum ATS score of 70%", "Address all critical ATS issues", "Use tool recommendations for optimization"]}',
    '{"validation_rules": ["ATS score must be 70% or higher", "Must use Resume Score Tracking tool", "Show improvement from baseline"], "evidence_required": ["Screenshot showing ATS score results", "Evidence of score improvement"]}',
    '{"score_bonus": {"70-79": 0, "80-89": 2, "90-100": 5}}',
    true
  ),
  (
    'RESUME_UPLOAD_DEFAULT',
    'RESUME',
    'Upload/Save Your Primary Resume as Default Resume (10 pts)',
    'Save your completed resume to Resource Library as the default version',
    'resume_management',
    ARRAY['file', 'screenshot'],
    10,
    'oneoff',
    'easy',
    10,
    '{"steps": ["Ensure resume is in PDF or Word format", "Navigate to Resources Library", "Upload your primary resume", "Set as default resume", "Verify successful upload and accessibility"], "requirements": ["Resume must be in PDF or DOC/DOCX format", "Must be saved to Resources Library", "Must be set as default/primary resume"]}',
    '{"validation_rules": ["File must be uploaded to Resources Library", "Resume must be in acceptable format", "Must be marked as default/primary"], "evidence_required": ["Screenshot showing successful upload", "Confirmation of default resume setting"]}',
    '{}',
    true
  ),
  (
    'RESUME_COVER_LETTER_LIBRARY',
    'RESUME',
    'Cover Letter Saved to Resources Library (10 pts)',
    'Create and save a professional cover letter to the Resource Library',
    'cover_letter',
    ARRAY['file', 'screenshot'],
    10,
    'oneoff',
    'medium',
    25,
    '{"steps": ["Create a professional cover letter", "Customize for target role/industry", "Save in PDF or Word format", "Upload to Resources Library", "Verify accessibility and organization"], "requirements": ["Cover letter must be professional and customized", "Must be saved to Resources Library", "Should complement your resume"]}',
    '{"validation_rules": ["Cover letter must be saved to library", "Must be professional quality", "Should be properly formatted"], "evidence_required": ["Screenshot showing cover letter in Resources Library", "File upload confirmation"]}',
    '{}',
    true
  );