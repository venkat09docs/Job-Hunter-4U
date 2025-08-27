-- Clean up orphaned career task assignments where user no longer exists
DELETE FROM career_task_assignments 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up orphaned LinkedIn assignments where user no longer exists  
DELETE FROM linkedin_assignments 
WHERE user_id NOT IN (SELECT id FROM auth.users);