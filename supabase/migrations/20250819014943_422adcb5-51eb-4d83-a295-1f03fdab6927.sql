-- Seed task templates for the Career Assignments system

-- Resume Tasks
INSERT INTO career_task_templates (code, module, title, description, category, evidence_types, points_reward, cadence, difficulty, estimated_duration, instructions, verification_criteria, bonus_rules) VALUES
('RESUME_UPLOAD_PRIMARY', 'RESUME', 'Upload Your Primary Resume', 'Upload your main resume as a PDF file', 'Resume Building', ARRAY['data_export'], 10, 'oneoff', 'easy', 15, 
'{"steps": ["Prepare your resume in PDF format", "Click upload and select your file", "Ensure file is under 5MB"]}',
'{"requirements": ["PDF format", "Contains email", "Contains phone", "At least 350 words"]}',
'{"quantified_bullets": 2}'::jsonb),

('RESUME_TAILOR_TO_ROLE', 'RESUME', 'Tailor Resume to Target Role', 'Customize your resume for a specific job role with relevant keywords', 'Resume Building', ARRAY['data_export'], 12, 'oneoff', 'medium', 30,
'{"steps": ["Define target role and keywords", "Update resume content", "Upload tailored version"]}',
'{"requirements": ["Keyword match ratio >= 60%", "Role-specific content"]}',
'{"high_keyword_match": 2}'::jsonb),

('RESUME_STAR_BULLETS', 'RESUME', 'Convert 5 Bullets to STAR Format', 'Rewrite 5 bullet points using Situation, Task, Action, Result format with metrics', 'Resume Building', ARRAY['data_export', 'screenshot'], 8, 'oneoff', 'medium', 45,
'{"steps": ["Identify 5 key achievements", "Structure using STAR format", "Include quantified results"]}',
'{"requirements": ["5 STAR-formatted bullets", "Quantified metrics", "Action verbs"]}',
'{}'),

('RESUME_LINKS_SECTION', 'RESUME', 'Add Professional Links Section', 'Include LinkedIn, GitHub, and portfolio links in your resume', 'Resume Building', ARRAY['data_export', 'screenshot'], 8, 'oneoff', 'easy', 20,
'{"steps": ["Add links section to resume", "Include LinkedIn profile", "Add GitHub and portfolio URLs"]}',
'{"requirements": ["At least 2 professional links", "LinkedIn URL", "Properly formatted"]}',
'{}'),

('RESUME_ATS_SCORE_PASS', 'RESUME', 'Pass Baseline ATS Score', 'Ensure your resume passes basic Applicant Tracking System requirements', 'Resume Building', ARRAY['data_export'], 10, 'oneoff', 'medium', 25,
'{"steps": ["Review ATS guidelines", "Format resume appropriately", "Test with ATS checker"]}',
'{"requirements": ["Max 2 pages", "Has email and phone", "350+ words", "Standard formatting"]}',
'{}');

-- LinkedIn Tasks  
INSERT INTO career_task_templates (code, module, title, description, category, evidence_types, points_reward, cadence, difficulty, estimated_duration, instructions, verification_criteria, bonus_rules) VALUES
('LI_HEADLINE_70', 'LINKEDIN', 'Optimize Headline (70-120 chars)', 'Create a compelling LinkedIn headline with 70-120 characters including keywords', 'LinkedIn Profile', ARRAY['screenshot', 'url'], 10, 'oneoff', 'easy', 20,
'{"steps": ["Research industry keywords", "Draft headline 70-120 characters", "Include value proposition", "Take screenshot"]}',
'{"requirements": ["70-120 character length", "Contains keywords", "Professional tone"]}',
'{"keyword_density": 1}'::jsonb),

('LI_ABOUT_200', 'LINKEDIN', 'Write About Section (200+ words)', 'Craft an outcome-oriented About section with at least 200 words', 'LinkedIn Profile', ARRAY['screenshot'], 12, 'oneoff', 'medium', 35,
'{"steps": ["Draft compelling story", "Include achievements", "Add call-to-action", "Take screenshot"]}',
'{"requirements": ["200+ words", "Outcome-focused", "Professional achievements"]}',
'{"engagement_keywords": 2}'::jsonb),

('LI_CUSTOM_URL', 'LINKEDIN', 'Set Custom Profile URL', 'Create a custom LinkedIn profile URL with your name', 'LinkedIn Profile', ARRAY['url', 'screenshot'], 8, 'oneoff', 'easy', 10,
'{"steps": ["Go to LinkedIn settings", "Edit public profile URL", "Choose professional URL", "Save and screenshot"]}',
'{"requirements": ["Custom URL format", "Professional naming"]}',
'{}'),

('LI_FEATURED_2', 'LINKEDIN', 'Add 2 Featured Items', 'Add 2 featured posts or external links to showcase your work', 'LinkedIn Profile', ARRAY['url', 'screenshot'], 10, 'oneoff', 'medium', 25,
'{"steps": ["Choose 2 best pieces of work", "Add to Featured section", "Include descriptions", "Take screenshot"]}',
'{"requirements": ["2 featured items", "Professional content", "Good descriptions"]}',
'{}'),

('LI_SKILLS_25', 'LINKEDIN', 'Add 25+ Skills & Pin Top 3', 'Add at least 25 relevant skills and pin your top 3 most important ones', 'LinkedIn Profile', ARRAY['screenshot'], 8, 'oneoff', 'easy', 15,
'{"steps": ["Add relevant skills", "Reach 25+ skills", "Pin top 3 skills", "Take screenshot"]}',
'{"requirements": ["25+ skills listed", "Top 3 skills pinned", "Industry-relevant"]}',
'{}'),

('LI_ACTIVITY_KICKOFF', 'LINKEDIN', 'Weekly Activity: 1 Post + 3 Comments', 'Create 1 meaningful post and leave 3 thoughtful comments on others posts', 'LinkedIn Activity', ARRAY['url', 'email', 'screenshot'], 15, 'weekly', 'medium', 60,
'{"steps": ["Create valuable post", "Engage with 3 posts meaningfully", "Submit URLs as evidence"]}',
'{"requirements": ["1 original post", "3 thoughtful comments", "Professional engagement"]}',
'{"viral_post": 5, "expert_comments": 3}'::jsonb);

-- GitHub Tasks
INSERT INTO career_task_templates (code, module, title, description, category, evidence_types, points_reward, cadence, difficulty, estimated_duration, instructions, verification_criteria, bonus_rules) VALUES  
('GH_USERNAME_SET', 'GITHUB', 'Save GitHub Profile URL', 'Provide your GitHub username and profile URL for verification', 'GitHub Profile', ARRAY['url'], 8, 'oneoff', 'easy', 5,
'{"steps": ["Navigate to your GitHub profile", "Copy profile URL", "Submit URL for verification"]}',
'{"requirements": ["Valid GitHub profile URL", "Public profile"]}',
'{}'),

('GH_PORTFOLIO_REPO', 'GITHUB', 'Create Portfolio Repository', 'Create a portfolio repository with a comprehensive README file', 'GitHub Profile', ARRAY['url', 'screenshot'], 12, 'oneoff', 'medium', 45,
'{"steps": ["Create new repository", "Name it portfolio or username", "Add detailed README", "Make repository public"]}',
'{"requirements": ["Public repository", "Comprehensive README", "Portfolio content"]}',
'{"comprehensive_readme": 3}'::jsonb),

('GH_PIN_3_REPOS', 'GITHUB', 'Pin 3 Relevant Repositories', 'Pin your 3 most relevant repositories to showcase your best work', 'GitHub Profile', ARRAY['url', 'screenshot'], 10, 'oneoff', 'easy', 15,
'{"steps": ["Choose 3 best repositories", "Go to profile settings", "Pin selected repositories", "Take screenshot"]}',
'{"requirements": ["3 pinned repositories", "Relevant to career goals", "Good documentation"]}',
'{}'),

('GH_TOPICS_ADD', 'GITHUB', 'Add 5+ Topics Across Repositories', 'Add at least 5 relevant topics/tags across your repositories', 'GitHub Profile', ARRAY['screenshot'], 8, 'oneoff', 'easy', 20,
'{"steps": ["Review your repositories", "Add relevant topics to each", "Ensure 5+ total topics", "Take screenshot"]}',
'{"requirements": ["5+ total topics", "Relevant keywords", "Consistent tagging"]}',
'{}'),

('GH_COMMIT_3DAYS', 'GITHUB', 'Commit on 3 Distinct Days', 'Make commits on at least 3 different days this week', 'GitHub Activity', ARRAY['url'], 15, 'weekly', 'easy', 30,
'{"steps": ["Plan daily coding activities", "Make meaningful commits", "Ensure 3 different days", "Commits tracked automatically"]}',
'{"requirements": ["3 distinct commit days", "Meaningful commits", "Within current week"]}',
'{"consistency_streak": 5}'::jsonb),

('GH_PROFILE_README', 'GITHUB', 'Create Profile README', 'Create a special README for your GitHub profile (username/username repository)', 'GitHub Profile', ARRAY['url', 'screenshot'], 12, 'oneoff', 'medium', 30,
'{"steps": ["Create username/username repository", "Add comprehensive README.md", "Include profile information", "Make repository public"]}',
'{"requirements": ["Special profile repository", "Comprehensive README", "Personal branding"]}',
'{"interactive_elements": 4}'::jsonb);

-- Insert badges
INSERT INTO linkedin_badges (code, title, icon, criteria) VALUES
('ATS_READY', 'ATS Ready', '🎯', '{"tasks": ["RESUME_UPLOAD_PRIMARY", "RESUME_TAILOR_TO_ROLE", "RESUME_STAR_BULLETS", "RESUME_LINKS_SECTION", "RESUME_ATS_SCORE_PASS"]}'::jsonb),
('LI_PROFILE_PRO', 'LinkedIn Profile Pro', '💼', '{"tasks": ["LI_HEADLINE_70", "LI_ABOUT_200", "LI_CUSTOM_URL", "LI_FEATURED_2", "LI_SKILLS_25"]}'::jsonb),
('GH_PORTFOLIO_SHIPPER', 'GitHub Portfolio Shipper', '🚀', '{"tasks": ["GH_PORTFOLIO_REPO", "GH_COMMIT_3DAYS", "GH_PROFILE_README"]}'::jsonb),
('CONSISTENT_3W', 'Consistent Performer (3 Weeks)', '⭐', '{"condition": "complete_weekly_tasks_for_3_consecutive_weeks"}'::jsonb);