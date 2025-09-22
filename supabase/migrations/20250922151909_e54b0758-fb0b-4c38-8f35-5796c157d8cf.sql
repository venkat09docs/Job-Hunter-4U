-- Add sample LinkedIn progress data for institute students
INSERT INTO linkedin_progress (user_id, task_id, completed, completed_at) VALUES 
  -- deepthi (3 tasks completed)
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'profile_optimized', true, now()),
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'headline_updated', true, now()),
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'summary_optimized', true, now()),
  
  -- keerthi (2 tasks completed)
  ('46254977-149f-4c97-826d-f2d6b9ac485b', 'profile_optimized', true, now()),
  ('46254977-149f-4c97-826d-f2d6b9ac485b', 'headline_updated', true, now()),
  
  -- Lalitha (1 task completed)
  ('c65be7b7-b2a2-43e4-8077-4c87f7837a99', 'profile_optimized', true, now()),
  
  -- abctesting (4 tasks completed)
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'profile_optimized', true, now()),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'headline_updated', true, now()),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'summary_optimized', true, now()),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'experience_added', true, now()),
  
  -- test20 (2 tasks completed)
  ('ae70326e-b4a6-4019-8a81-013eeb71d424', 'profile_optimized', true, now()),
  ('ae70326e-b4a6-4019-8a81-013eeb71d424', 'headline_updated', true, now())
ON CONFLICT (user_id, task_id) DO NOTHING;

-- Add sample GitHub progress data for institute students
INSERT INTO github_progress (user_id, task_id, completed, completed_at) VALUES 
  -- deepthi (3 profile tasks completed)
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'readme_generated', true, now()),
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'special_repo_created', true, now()),
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'readme_added', true, now()),
  
  -- keerthi (2 profile tasks completed)
  ('46254977-149f-4c97-826d-f2d6b9ac485b', 'readme_generated', true, now()),
  ('46254977-149f-4c97-826d-f2d6b9ac485b', 'special_repo_created', true, now()),
  
  -- Lalitha (1 profile task completed)
  ('c65be7b7-b2a2-43e4-8077-4c87f7837a99', 'readme_generated', true, now()),
  
  -- abctesting (4 profile tasks completed)
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'readme_generated', true, now()),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'special_repo_created', true, now()),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'readme_added', true, now()),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'repo_public', true, now()),
  
  -- test20 (2 profile tasks completed)
  ('ae70326e-b4a6-4019-8a81-013eeb71d424', 'readme_generated', true, now()),
  ('ae70326e-b4a6-4019-8a81-013eeb71d424', 'special_repo_created', true, now())
ON CONFLICT (user_id, task_id) DO NOTHING;

-- Add sample resume data for institute students
INSERT INTO resume_data (user_id, personal_details, experience, education, skills_interests, professional_summary) VALUES 
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 
   '{"name": "Deepthi", "email": "deepthi@example.com", "phone": "123-456-7890"}',
   '[{"company": "Tech Corp", "position": "Developer", "duration": "2020-2023"}]',
   '[{"degree": "B.Tech", "institution": "University", "year": "2020"}]',
   '["React", "Node.js", "Python"]',
   '"Experienced software developer with expertise in full-stack development"'),
  
  ('46254977-149f-4c97-826d-f2d6b9ac485b',
   '{"name": "Keerthi", "email": "keerthi@example.com", "phone": "123-456-7891"}',
   '[{"company": "Startup Inc", "position": "Frontend Developer", "duration": "2021-2023"}]',
   '[{"degree": "MCA", "institution": "Tech University", "year": "2021"}]',
   '["JavaScript", "React", "CSS"]',
   '"Frontend specialist with modern web development skills"'),
   
  ('c65be7b7-b2a2-43e4-8077-4c87f7837a99',
   '{"name": "Lalitha", "email": "lalitha@example.com", "phone": "123-456-7892"}',
   '[]',
   '[{"degree": "B.Sc", "institution": "College", "year": "2022"}]',
   '["Java", "Spring Boot"]',
   '"Recent graduate eager to start career in software development"'),
   
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae',
   '{"name": "ABC Testing", "email": "abc@example.com", "phone": "123-456-7893"}',
   '[{"company": "Enterprise Solutions", "position": "Senior Developer", "duration": "2019-2023"}]',
   '[{"degree": "M.Tech", "institution": "Premier Institute", "year": "2019"}]',
   '["Java", "Spring", "Microservices", "AWS"]',
   '"Senior developer with enterprise application development experience"'),
   
  ('ae70326e-b4a6-4019-8a81-013eeb71d424',
   '{"name": "Test20", "email": "test20@example.com", "phone": "123-456-7894"}',
   '[{"company": "Digital Agency", "position": "Web Developer", "duration": "2022-2023"}]',
   '[{"degree": "BCA", "institution": "Computer College", "year": "2022"}]',
   '["HTML", "CSS", "JavaScript", "PHP"]',
   '"Web developer with focus on modern web technologies"')
ON CONFLICT (user_id) DO UPDATE SET
  personal_details = EXCLUDED.personal_details,
  experience = EXCLUDED.experience,
  education = EXCLUDED.education,
  skills_interests = EXCLUDED.skills_interests,
  professional_summary = EXCLUDED.professional_summary,
  updated_at = now();

-- Add sample job tracker data for institute students
INSERT INTO job_tracker (user_id, company_name, job_title, status, application_date) VALUES
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'Google', 'Software Engineer', 'applied', '2025-09-15'),
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'Microsoft', 'Frontend Developer', 'interviewing', '2025-09-18'),
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'Amazon', 'Full Stack Developer', 'applied', '2025-09-20'),
  
  ('46254977-149f-4c97-826d-f2d6b9ac485b', 'Facebook', 'React Developer', 'applied', '2025-09-16'),
  ('46254977-149f-4c97-826d-f2d6b9ac485b', 'Netflix', 'UI Engineer', 'interviewing', '2025-09-19'),
  
  ('c65be7b7-b2a2-43e4-8077-4c87f7837a99', 'Startup Co', 'Junior Developer', 'applied', '2025-09-17'),
  
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'Oracle', 'Senior Developer', 'applied', '2025-09-14'),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'IBM', 'Technical Lead', 'offer', '2025-09-16'),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'Salesforce', 'Cloud Developer', 'applied', '2025-09-21'),
  
  ('ae70326e-b4a6-4019-8a81-013eeb71d424', 'Adobe', 'Web Developer', 'applied', '2025-09-18'),
  ('ae70326e-b4a6-4019-8a81-013eeb71d424', 'Spotify', 'Frontend Engineer', 'applied', '2025-09-20')
ON CONFLICT DO NOTHING;

-- Add LinkedIn network metrics for institute students
INSERT INTO linkedin_network_metrics (user_id, activity_id, value) VALUES
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'connections', 250),
  ('36e9ab0b-23fa-405d-8fe5-73304c5ef08c', 'posts', 15),
  ('46254977-149f-4c97-826d-f2d6b9ac485b', 'connections', 180),
  ('46254977-149f-4c97-826d-f2d6b9ac485b', 'posts', 8),
  ('c65be7b7-b2a2-43e4-8077-4c87f7837a99', 'connections', 120),
  ('c65be7b7-b2a2-43e4-8077-4c87f7837a99', 'posts', 5),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'connections', 320),
  ('ec2203d8-7129-4c21-8735-e6ba298c9aae', 'posts', 22),
  ('ae70326e-b4a6-4019-8a81-013eeb71d424', 'connections', 200),
  ('ae70326e-b4a6-4019-8a81-013eeb71d424', 'posts', 12)
ON CONFLICT (user_id, activity_id) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Add the missing activity point setting for linkedin_total_tasks
INSERT INTO activity_point_settings (activity_id, activity_name, activity_type, points, category, description, is_active) VALUES
  ('linkedin_total_tasks', 'LinkedIn Total Tasks', 'linkedin', 9, 'Social Media', 'Total number of LinkedIn optimization tasks available', true)
ON CONFLICT (activity_id) DO UPDATE SET
  points = EXCLUDED.points,
  updated_at = now();