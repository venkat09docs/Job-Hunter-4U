-- Deactivate Supabase and n8n practice task templates
UPDATE public.career_task_templates 
SET is_active = false 
WHERE category IN ('supabase_practice', 'n8n_practice');