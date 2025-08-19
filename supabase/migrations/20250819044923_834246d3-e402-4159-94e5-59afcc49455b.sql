-- Add missing bonus_rules column to job_hunting_task_templates
ALTER TABLE job_hunting_task_templates 
ADD COLUMN IF NOT EXISTS bonus_rules jsonb DEFAULT '{}'::jsonb;

-- Clear existing templates to replace with the specific catalog
DELETE FROM job_hunting_task_templates WHERE is_active = true;

-- Insert Weekly Quota Tasks (scope = WEEKLY, cadence = weekly)
INSERT INTO job_hunting_task_templates (
  title, 
  description, 
  category, 
  difficulty, 
  evidence_types, 
  cadence, 
  points_reward, 
  estimated_duration,
  verification_criteria,
  instructions,
  bonus_rules
) VALUES
-- APPLY_5 - Apply to 5 roles this week
(
  'Apply to 5 Job Roles',
  'Submit applications to 5 different job openings this week',
  'application',
  'medium',
  ARRAY['url', 'email_signal', 'screenshot'],
  'weekly',
  30,
  180,
  '{"min_applications": 5, "evidence_required": "url_or_email_or_screenshot"}'::jsonb,
  '{"steps": ["Find 5 suitable job openings", "Tailor resume for each role", "Submit applications", "Save confirmation URLs/screenshots"], "tips": ["Apply to different companies for bonus points", "Keep track of application dates", "Save confirmation emails"]}'::jsonb,
  '{"company_diversity_bonus": {"condition": "applications_to_different_companies >= 2", "points": 5, "description": "+5 points for applying to 2+ different companies"}}'::jsonb
),

-- REFERRALS_3 - Request 3 referrals
(
  'Request 3 Job Referrals',
  'Reach out to contacts for referrals at target companies',
  'networking',
  'medium',
  ARRAY['url', 'email_signal', 'screenshot'],
  'weekly',
  25,
  120,
  '{"min_referrals": 3, "evidence_required": "url_or_email_or_screenshot"}'::jsonb,
  '{"steps": ["Identify target companies", "Find connections at those companies", "Craft personalized referral requests", "Send messages via LinkedIn/email"], "tips": ["Mention specific roles you are interested in", "Offer to share your resume", "Be respectful of their time"]}'::jsonb,
  '{}'::jsonb
),

-- FOLLOWUPS_5 - Send 5 follow-ups within 48h
(
  'Send 5 Follow-up Messages',
  'Follow up on applications within 48 hours of applying',
  'follow_up',
  'easy',
  ARRAY['email_signal', 'screenshot'],
  'weekly',
  20,
  60,
  '{"min_followups": 5, "time_limit_hours": 48, "evidence_required": "email_or_screenshot"}'::jsonb,
  '{"steps": ["Track application dates", "Set reminders for 24-48h follow-up", "Craft professional follow-up messages", "Send via email or LinkedIn"], "tips": ["Keep messages brief and professional", "Reiterate your interest", "Attach your resume if not done initially"]}'::jsonb,
  '{"quick_followup_bonus": {"condition": "followup_within_36_hours", "points": 3, "description": "+3 points for follow-ups sent within 36 hours"}}'::jsonb
),

-- NETWORKING_3 - Start 3 new conversations
(
  'Start 3 New Professional Conversations',
  'Initiate meaningful conversations with industry professionals',
  'networking',
  'medium',
  ARRAY['url', 'email_signal', 'screenshot'],
  'weekly',
  22,
  90,
  '{"min_conversations": 3, "evidence_required": "url_or_email_or_screenshot"}'::jsonb,
  '{"steps": ["Identify professionals in your target industry", "Research their background and interests", "Craft personalized connection requests", "Follow up with meaningful messages"], "tips": ["Comment on their posts before connecting", "Ask thoughtful questions", "Offer value in your conversations"]}'::jsonb,
  '{}'::jsonb
);

-- Insert Per-Job Workflow Tasks (scope = JOB, cadence = per_job)
INSERT INTO job_hunting_task_templates (
  title, 
  description, 
  category, 
  difficulty, 
  evidence_types, 
  cadence, 
  points_reward, 
  estimated_duration,
  verification_criteria,
  instructions,
  bonus_rules
) VALUES
-- JOB_ADD - Save job with URL & basic details
(
  'Add Job Opportunity',
  'Save job posting with URL and key details to your pipeline',
  'research',
  'easy',
  ARRAY['url'],
  'per_job',
  6,
  10,
  '{"url_required": true, "job_details_required": true}'::jsonb,
  '{"steps": ["Find job posting", "Save URL", "Add company name and job title", "Note key requirements"], "tips": ["Copy the full URL", "Note application deadline", "Save salary range if available"]}'::jsonb,
  '{}'::jsonb
),

-- JOB_RESEARCH - Company research
(
  'Research Target Company',
  'Conduct thorough research on company mission, products, and recent news',
  'research',
  'medium',
  ARRAY['screenshot', 'file'],
  'per_job',
  10,
  45,
  '{"insights_required": 3, "research_notes_required": true}'::jsonb,
  '{"steps": ["Visit company website and read mission/values", "Research recent company news", "Check their products/services", "Look up key team members", "Document 3 key insights"], "tips": ["Use multiple sources", "Focus on recent developments", "Note how your skills align"]}'::jsonb,
  '{"news_links_bonus": {"condition": "research_includes_3_recent_news_links", "points": 3, "description": "+3 points for including 3+ recent news links"}}'::jsonb
),

-- JOB_TAILOR_RESUME - Upload tailored resume
(
  'Tailor Resume for Position',
  'Customize your resume highlighting relevant experience for this specific role',
  'application',
  'medium',
  ARRAY['file'],
  'per_job',
  12,
  60,
  '{"file_required": true, "file_type": "pdf"}'::jsonb,
  '{"steps": ["Review job requirements", "Identify relevant experience", "Adjust resume sections", "Optimize keywords", "Save as PDF"], "tips": ["Match keywords from job posting", "Quantify achievements", "Keep it to 1-2 pages"]}'::jsonb,
  '{}'::jsonb
),

-- JOB_TAILOR_CL - Upload tailored cover letter
(
  'Write Tailored Cover Letter',
  'Create a customized cover letter addressing specific role requirements',
  'application',
  'medium',
  ARRAY['file'],
  'per_job',
  10,
  45,
  '{"file_required": true, "file_type": "pdf"}'::jsonb,
  '{"steps": ["Address hiring manager by name if possible", "Reference specific job requirements", "Highlight relevant achievements", "Show company knowledge", "Save as PDF"], "tips": ["Keep it concise (1 page)", "Show enthusiasm for the role", "Proofread carefully"]}'::jsonb,
  '{}'::jsonb
),

-- JOB_APPLY - Submit application
(
  'Submit Job Application',
  'Complete and submit your application with all required materials',
  'application',
  'easy',
  ARRAY['url', 'email_signal', 'screenshot'],
  'per_job',
  15,
  30,
  '{"application_submitted": true, "confirmation_captured": true}'::jsonb,
  '{"steps": ["Complete application form", "Upload resume and cover letter", "Submit application", "Save confirmation page/email"], "tips": ["Double-check all information", "Save confirmation number", "Note submission date and time"]}'::jsonb,
  '{}'::jsonb
),

-- JOB_REFERRAL_REQ - Request referral
(
  'Request Job Referral',
  'Reach out to contacts for referral at this specific company',
  'networking',
  'medium',
  ARRAY['url', 'email_signal', 'screenshot'],
  'per_job',
  8,
  25,
  '{"referral_requested": true, "contact_message_sent": true}'::jsonb,
  '{"steps": ["Identify contacts at the company", "Craft personalized referral request", "Include job link and your resume", "Send via LinkedIn or email"], "tips": ["Be specific about the role", "Explain why you are a good fit", "Make it easy for them to help"]}'::jsonb,
  '{}'::jsonb
),

-- JOB_FOLLOWUP_48H - Follow up after applying
(
  'Follow Up on Application',
  'Send professional follow-up message within 48 hours of applying',
  'follow_up',
  'easy',
  ARRAY['email_signal', 'screenshot'],
  'per_job',
  8,
  15,
  '{"followup_within_48h": true, "professional_message": true}'::jsonb,
  '{"steps": ["Wait 24-48 hours after applying", "Craft brief follow-up message", "Reiterate interest in role", "Send to hiring manager or recruiter"], "tips": ["Keep it short and professional", "Reference the specific role", "Express continued interest"]}'::jsonb,
  '{"early_followup_bonus": {"condition": "followup_within_36_hours", "points": 2, "description": "+2 points for following up within 36 hours"}}'::jsonb
),

-- JOB_INTERVIEW_PREP - Interview preparation
(
  'Prepare Interview Materials',
  'Create comprehensive interview preparation plan and materials',
  'interview',
  'medium',
  ARRAY['file', 'screenshot'],
  'per_job',
  12,
  90,
  '{"prep_plan_required": true, "one_page_format": true}'::jsonb,
  '{"steps": ["Research common interview questions", "Prepare STAR method examples", "Research interviewer backgrounds", "Practice company-specific questions", "Create 1-page prep summary"], "tips": ["Include questions to ask them", "Prepare examples from your experience", "Practice out loud"]}'::jsonb,
  '{}'::jsonb
),

-- JOB_THANK_YOU - Send thank you note
(
  'Send Interview Thank You Note',
  'Send professional thank you message within 24 hours of interview',
  'follow_up',
  'easy',
  ARRAY['email_signal', 'screenshot'],
  'per_job',
  6,
  15,
  '{"thank_you_within_24h": true, "personalized_message": true}'::jsonb,
  '{"steps": ["Send within 24 hours of interview", "Thank interviewer for their time", "Reiterate key qualifications", "Address any concerns discussed"], "tips": ["Reference specific conversation points", "Keep it concise", "Proofread before sending"]}'::jsonb,
  '{}'::jsonb
),

-- JOB_DECISION_LOG - Log final outcome
(
  'Log Job Outcome & Decision',
  'Record final decision (offer/rejection/withdrawal) with detailed notes',
  'tracking',
  'easy',
  ARRAY['screenshot', 'file'],
  'per_job',
  8,
  20,
  '{"outcome_logged": true, "notes_provided": true}'::jsonb,
  '{"steps": ["Record final outcome", "Note salary/benefits if offer", "Document feedback received", "Update job pipeline status", "Save relevant communications"], "tips": ["Include lessons learned", "Note what went well/poorly", "Save for future reference"]}'::jsonb,
  '{}'::jsonb
);