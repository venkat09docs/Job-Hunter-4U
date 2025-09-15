-- Add foreign key constraint between clp_assignments and course_sections
ALTER TABLE clp_assignments 
ADD CONSTRAINT clp_assignments_section_id_fkey 
FOREIGN KEY (section_id) REFERENCES course_sections(id) 
ON DELETE CASCADE;