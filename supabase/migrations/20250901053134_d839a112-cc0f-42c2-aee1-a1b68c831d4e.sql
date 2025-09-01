-- Fix GitHub weekly assignments for current period (2025-36) with correct individual due dates
-- This corrects the due dates that were not properly set in the previous migration

DO $$
DECLARE
    task_record RECORD;
    week_start DATE;
    due_date_calc TIMESTAMP WITH TIME ZONE;
    day_assignment INTEGER;
    updated_count INTEGER := 0;
BEGIN
    -- Calculate Monday of current week (period 2025-36)
    -- Week 36 of 2025 starts on Monday September 2, 2025
    week_start := '2025-09-02'::DATE; -- Correct Monday of week 36
    
    -- Update each task with individual due dates based on display_order
    FOR task_record IN 
        SELECT gut.id, gut.task_id, gt.display_order, gt.title, gt.code
        FROM github_user_tasks gut
        JOIN github_tasks gt ON gut.task_id = gt.id
        WHERE gut.period = '2025-36'
        AND gt.active = true
    LOOP
        day_assignment := COALESCE(task_record.display_order, 1);
        
        IF day_assignment = 7 THEN
            -- Day 7 (Sunday tasks) are due on Sunday evening (same week)
            due_date_calc := week_start + INTERVAL '6 days' + TIME '23:59:59';
        ELSE
            -- Other tasks are due the next day evening
            -- Day 1 (Monday) → Due Tuesday evening
            -- Day 2 (Tuesday) → Due Wednesday evening, etc.
            due_date_calc := week_start + (day_assignment || ' days')::INTERVAL + TIME '23:59:59';
        END IF;
        
        -- Update the task with new due date
        UPDATE github_user_tasks 
        SET due_at = due_date_calc,
            updated_at = NOW()
        WHERE id = task_record.id;
        
        updated_count := updated_count + 1;
        
        -- Log the update
        RAISE NOTICE 'Updated task % (Day %): % - Due: %', 
            task_record.title, 
            day_assignment,
            task_record.code, 
            due_date_calc;
    END LOOP;
    
    RAISE NOTICE 'Successfully updated % GitHub weekly tasks for period 2025-36 with correct individual due dates', updated_count;
END $$;