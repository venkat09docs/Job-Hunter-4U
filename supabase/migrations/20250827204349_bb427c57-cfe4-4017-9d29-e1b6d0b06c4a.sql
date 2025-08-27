-- Add missing assignments for current week (Day 5, 6, 7 tasks)
INSERT INTO job_hunting_assignments (
    user_id, 
    template_id, 
    week_start_date, 
    status, 
    due_date, 
    points_earned, 
    score_awarded,
    assigned_at
)
SELECT 
    '2eb353a2-f3fd-4c88-b17f-6569e76d6154' as user_id,
    ctt.id as template_id,
    '2025-08-26' as week_start_date,  -- Current week start
    'assigned' as status,
    '2025-09-01 23:59:59'::timestamp as due_date,  -- End of week
    0 as points_earned,
    0 as score_awarded,
    NOW() as assigned_at
FROM job_hunting_task_templates ctt
WHERE ctt.is_active = true 
    AND ctt.cadence = 'weekly'
    AND ctt.title IN ('Day 5 – Follow-ups (Friday)', 'Day 6 – Response & Interview Prep (Saturday)', 'Day 7 – Weekly Review (Sunday)')
    AND NOT EXISTS (
        SELECT 1 FROM job_hunting_assignments jha 
        WHERE jha.template_id = ctt.id 
            AND jha.user_id = '2eb353a2-f3fd-4c88-b17f-6569e76d6154' 
            AND jha.week_start_date = '2025-08-26'
    );