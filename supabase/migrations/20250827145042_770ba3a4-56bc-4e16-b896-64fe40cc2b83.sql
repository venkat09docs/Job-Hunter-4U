-- First, check the current constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conname LIKE '%category%' AND conrelid = 'career_task_templates'::regclass;

-- Drop the existing check constraint
ALTER TABLE career_task_templates DROP CONSTRAINT IF EXISTS career_task_templates_category_check;

-- Add the new check constraint with interview_preparation
ALTER TABLE career_task_templates ADD CONSTRAINT career_task_templates_category_check 
CHECK (category IN ('networking', 'resume_building', 'interview_preparation'));

-- Now insert the interview preparation task templates
INSERT INTO career_task_templates (
  title,
  description,
  category,
  code,
  difficulty,
  estimated_duration,
  points_reward,
  evidence_types,
  instructions,
  verification_criteria,
  is_active
) VALUES 
(
  'Research the Company',
  'Visit company website, careers page, and LinkedIn profile. Prepare a 1-page company summary (industry, products, culture, recent news).',
  'interview_preparation',
  'INTERVIEW_COMPANY_RESEARCH',
  'medium',
  60,
  15,
  ARRAY['file', 'url'],
  '{"steps": ["Visit company website and careers page", "Check company LinkedIn profile", "Research recent news and press releases", "Create 1-page summary covering industry, products, culture, and recent developments"], "deliverables": ["Company research summary document"], "tips": ["Focus on recent news and company culture", "Look for mutual connections on LinkedIn", "Check company blog and social media"]}',
  '{"requirements": ["Company summary document uploaded", "Must cover industry, products, culture, and recent news", "Document should be 1 page"], "scoring": {"excellent": "Comprehensive research with recent insights", "good": "Solid research covering all areas", "needs_improvement": "Missing key information"}}',
  true
),
(
  'Review Job Description Deeply',
  'Highlight top 5 skills/tools mentioned. Match each with your past project/example. Write 3 talking points showing your fit.',
  'interview_preparation',
  'INTERVIEW_JD_ANALYSIS',
  'medium',
  45,
  15,
  ARRAY['file'],
  '{"steps": ["Carefully read and highlight the job description", "Identify top 5 skills/tools mentioned", "Match each skill with your past projects or examples", "Create 3 key talking points that demonstrate your fit"], "deliverables": ["JD analysis document with skill matching"], "tips": ["Use specific examples from your experience", "Quantify your achievements where possible", "Align your experience with their requirements"]}',
  '{"requirements": ["5 skills identified and matched", "3 talking points created", "Specific examples provided for each skill"], "scoring": {"excellent": "Clear matching with quantified examples", "good": "Good matching with relevant examples", "needs_improvement": "Vague or insufficient matching"}}',
  true
),
(
  'Update Interview Prep Sheet',
  'Add job role, recruiter name, and interview type (HR, technical, manager). Note down expected questions based on JD.',
  'interview_preparation',
  'INTERVIEW_PREP_SHEET',
  'easy',
  30,
  10,
  ARRAY['file'],
  '{"steps": ["Create or update your interview prep sheet", "Add job role and company details", "Include recruiter/interviewer information", "Identify interview type and format", "List expected questions based on job description"], "deliverables": ["Completed interview prep sheet"], "tips": ["Research the interviewer on LinkedIn", "Prepare for different interview formats", "Have backup questions ready"]}',
  '{"requirements": ["All job details filled", "Expected questions listed", "Interview format identified"], "scoring": {"excellent": "Comprehensive prep sheet with detailed questions", "good": "Good prep sheet with key information", "needs_improvement": "Basic information only"}}',
  true
),
(
  'Prepare "Tell Me About Yourself"',
  'Draft a customized 60–90 sec version aligned with that specific role.',
  'interview_preparation',
  'INTERVIEW_TELL_ABOUT_YOURSELF',
  'medium',
  45,
  15,
  ARRAY['file', 'video'],
  '{"steps": ["Draft your tell me about yourself response", "Customize it for the specific role", "Keep it between 60-90 seconds", "Practice and refine", "Record yourself practicing"], "deliverables": ["Written script and practice recording"], "tips": ["Start with current role", "Highlight relevant experience", "End with why you are interested in this role"]}',
  '{"requirements": ["60-90 second response", "Role-specific customization", "Clear structure"], "scoring": {"excellent": "Compelling, well-structured, role-specific", "good": "Clear and relevant", "needs_improvement": "Generic or poorly structured"}}',
  true
),
(
  'Revise Core Concepts',
  'Study at least 5 role-specific concepts daily (technical or domain). Summarize learnings in notes.',
  'interview_preparation',
  'INTERVIEW_CONCEPT_STUDY',
  'hard',
  120,
  20,
  ARRAY['file'],
  '{"steps": ["Identify 5 core concepts relevant to the role", "Study each concept thoroughly", "Create summary notes for each", "Practice explaining concepts simply", "Prepare examples of how you have used these concepts"], "deliverables": ["Study notes with concept summaries"], "tips": ["Focus on concepts mentioned in JD", "Use multiple learning resources", "Practice explaining to others"]}',
  '{"requirements": ["5 concepts studied", "Summary notes created", "Practical examples included"], "scoring": {"excellent": "Deep understanding with practical examples", "good": "Good grasp of concepts", "needs_improvement": "Surface level understanding"}}',
  true
),
(
  'Practice Behavioral Questions',
  'Use the STAR method (Situation, Task, Action, Result) for: Team conflict, Handling deadlines, Achievements/failures.',
  'interview_preparation',
  'INTERVIEW_BEHAVIORAL_PREP',
  'medium',
  90,
  20,
  ARRAY['file', 'video'],
  '{"steps": ["Learn the STAR method framework", "Prepare examples for team conflict situations", "Prepare examples for deadline management", "Prepare examples of achievements and failures", "Practice delivering responses using STAR"], "deliverables": ["STAR method responses document"], "tips": ["Use specific, recent examples", "Quantify results where possible", "Show learning from failures"]}',
  '{"requirements": ["3 STAR examples prepared", "Covers all required scenarios", "Clear structure"], "scoring": {"excellent": "Compelling stories with quantified results", "good": "Good examples with clear structure", "needs_improvement": "Weak examples or poor structure"}}',
  true
),
(
  'Mock Interview Assignment',
  'Record a mock interview (self-video or with peer/mentor). Review performance (clarity, confidence, time taken).',
  'interview_preparation',
  'INTERVIEW_MOCK_PRACTICE',
  'hard',
  120,
  25,
  ARRAY['video', 'file'],
  '{"steps": ["Set up mock interview environment", "Practice common interview questions", "Record your mock interview", "Review your performance critically", "Note areas for improvement"], "deliverables": ["Mock interview recording and self-assessment"], "tips": ["Practice in similar environment to actual interview", "Time your responses", "Focus on body language and confidence"]}',
  '{"requirements": ["Mock interview completed", "Self-assessment provided", "Areas for improvement identified"], "scoring": {"excellent": "Professional performance with detailed self-assessment", "good": "Good practice with reasonable assessment", "needs_improvement": "Basic practice with minimal assessment"}}',
  true
),
(
  'Portfolio/Project Readiness',
  'Pick 2–3 projects from GitHub/Portfolio. Prepare quick "elevator pitch" for each (Problem → Solution → Result).',
  'interview_preparation',
  'INTERVIEW_PORTFOLIO_PREP',
  'medium',
  60,
  20,
  ARRAY['url', 'file'],
  '{"steps": ["Select 2-3 best projects from your portfolio", "Create elevator pitch for each project", "Structure: Problem → Solution → Result", "Prepare to demonstrate key features", "Practice explaining technical decisions"], "deliverables": ["Project pitch documents and portfolio links"], "tips": ["Choose projects relevant to the role", "Quantify the results and impact", "Be ready to discuss challenges faced"]}',
  '{"requirements": ["2-3 projects selected", "Elevator pitches prepared", "Portfolio links provided"], "scoring": {"excellent": "Compelling project stories with clear impact", "good": "Good project presentation", "needs_improvement": "Weak project presentation"}}',
  true
),
(
  'Logistics & Setup',
  'Confirm interview schedule, time zone, and platform (Zoom, Teams, etc.). Test internet, webcam, microphone.',
  'interview_preparation',
  'INTERVIEW_LOGISTICS_SETUP',
  'easy',
  30,
  10,
  ARRAY['url', 'file'],
  '{"steps": ["Confirm interview date, time, and timezone", "Verify interview platform and access", "Test your internet connection", "Test webcam and microphone quality", "Prepare backup plans"], "deliverables": ["Logistics checklist and test results"], "tips": ["Test everything 24 hours before", "Have phone backup ready", "Prepare your interview space"]}',
  '{"requirements": ["All logistics confirmed", "Technical setup tested", "Backup plans ready"], "scoring": {"excellent": "Everything tested and backup ready", "good": "Basic setup confirmed", "needs_improvement": "Minimal preparation"}}',
  true
),
(
  'Post-Interview Follow-Up',
  'Prepare a polite thank-you email template to send after the interview.',
  'interview_preparation',
  'INTERVIEW_FOLLOWUP_TEMPLATE',
  'easy',
  20,
  10,
  ARRAY['file'],
  '{"steps": ["Draft a professional thank-you email template", "Personalize for the specific interview", "Include key discussion points", "Express continued interest", "Set appropriate follow-up timeline"], "deliverables": ["Thank-you email template"], "tips": ["Send within 24 hours", "Reference specific conversation points", "Keep it concise and professional"]}',
  '{"requirements": ["Professional email template", "Personalized content", "Appropriate tone"], "scoring": {"excellent": "Highly personalized and professional", "good": "Good template with personal touches", "needs_improvement": "Generic template"}}',
  true
);