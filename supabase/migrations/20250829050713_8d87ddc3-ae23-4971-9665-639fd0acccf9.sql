-- Add foreign key constraint between career_task_assignments and career_task_templates
ALTER TABLE public.career_task_assignments 
ADD CONSTRAINT fk_career_task_assignments_template_id 
FOREIGN KEY (template_id) 
REFERENCES public.career_task_templates(id) 
ON DELETE CASCADE;

-- Add foreign key constraint between career_task_evidence and career_task_assignments  
ALTER TABLE public.career_task_evidence 
ADD CONSTRAINT fk_career_task_evidence_assignment_id 
FOREIGN KEY (assignment_id) 
REFERENCES public.career_task_assignments(id) 
ON DELETE CASCADE;