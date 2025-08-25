-- Reset LinkedIn tasks for the current test user
-- Delete evidence for old tasks
DELETE FROM linkedin_evidence 
WHERE user_task_id IN (
  SELECT id FROM linkedin_user_tasks 
  WHERE user_id = 'de70df45-80c5-48ab-9534-ad15720b2623' 
  AND period = '2025-34'
);

-- Delete old tasks
DELETE FROM linkedin_user_tasks 
WHERE user_id = 'de70df45-80c5-48ab-9534-ad15720b2623' 
AND period = '2025-34';

-- Clear any old scores for the old period
DELETE FROM linkedin_scores 
WHERE user_id = 'de70df45-80c5-48ab-9534-ad15720b2623' 
AND period = '2025-34';