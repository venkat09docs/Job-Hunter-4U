-- Deactivate any remaining n8n and Supabase related task templates
UPDATE career_task_templates 
SET is_active = false, updated_at = now()
WHERE category IN ('supabase', 'n8n') OR 
      title ILIKE '%supabase%' OR 
      title ILIKE '%n8n%' OR
      description ILIKE '%supabase%' OR 
      description ILIKE '%n8n%';