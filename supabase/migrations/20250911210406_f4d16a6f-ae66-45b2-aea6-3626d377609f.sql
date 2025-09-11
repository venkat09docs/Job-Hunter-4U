-- Update GitHub user tasks for current week (2025-37) to have correct due dates
-- Day 1 (Monday) - Due Tuesday evening
-- Day 2 (Tuesday) - Due Wednesday evening  
-- Day 3 (Wednesday) - Due Thursday evening
-- Day 4 (Thursday) - Due Friday evening
-- Day 5 (Friday) - Due Monday evening (next week)
-- Day 6 (Saturday) - Due Tuesday evening (next week)
-- Day 7 (Sunday) - Due Sunday evening (same day)

WITH current_week_start AS (
  SELECT DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day' AS monday
),
task_updates AS (
  SELECT 
    gut.id,
    gt.display_order,
    CASE 
      WHEN gt.display_order = 7 THEN 
        -- Sunday tasks are due on Sunday evening (same day)
        (SELECT monday FROM current_week_start) + INTERVAL '6 days' + TIME '23:59:59.999'
      WHEN gt.display_order >= 5 THEN
        -- Friday and Saturday tasks are due next Monday/Tuesday evening
        (SELECT monday FROM current_week_start) + INTERVAL '7 days' + INTERVAL '1 day' * (gt.display_order - 5) + TIME '23:59:59.999'
      ELSE
        -- Monday-Thursday tasks are due the next day evening
        (SELECT monday FROM current_week_start) + INTERVAL '1 day' * gt.display_order + TIME '23:59:59.999'
    END AS new_due_at
  FROM github_user_tasks gut
  JOIN github_tasks gt ON gut.task_id = gt.id
  WHERE gut.period = '2025-37'
)
UPDATE github_user_tasks 
SET due_at = task_updates.new_due_at,
    updated_at = NOW()
FROM task_updates 
WHERE github_user_tasks.id = task_updates.id;