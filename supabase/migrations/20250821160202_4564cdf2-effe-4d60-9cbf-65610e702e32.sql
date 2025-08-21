-- Delete all career assignment related data (in correct order due to dependencies)

-- Delete evidence first (depends on assignments)
DELETE FROM public.career_task_evidence;

-- Delete assignments (depends on templates)
DELETE FROM public.career_task_assignments;

-- Delete weekly schedules
DELETE FROM public.career_weekly_schedules;

-- Delete templates last
DELETE FROM public.career_task_templates;