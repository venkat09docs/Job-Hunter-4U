-- Clean up old week assignments to avoid duplicates and fix current week dates
-- First, let's get the correct current week start (Monday of this week)
WITH current_week AS (
    SELECT date_trunc('week', CURRENT_DATE) + interval '1 day' as week_start
),
-- Delete assignments from old weeks (keep only current week)
cleanup_old AS (
    DELETE FROM job_hunting_assignments 
    WHERE user_id = '2eb353a2-f3fd-4c88-b17f-6569e76d6154' 
        AND week_start_date < '2025-08-25'
    RETURNING id
),
-- Update assignments to correct current week start date
update_current AS (
    UPDATE job_hunting_assignments 
    SET week_start_date = '2025-08-26'  -- This week's Monday
    WHERE user_id = '2eb353a2-f3fd-4c88-b17f-6569e76d6154' 
        AND week_start_date = '2025-08-25'
    RETURNING id
)
-- Add any missing assignments for current week (Day 5, 6, 7 if not already added)
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
    '2025-08-26' as week_start_date,  
    'assigned' as status,
    '2025-09-01 23:59:59'::timestamp as due_date,  
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
    )
ON CONFLICT DO NOTHING;