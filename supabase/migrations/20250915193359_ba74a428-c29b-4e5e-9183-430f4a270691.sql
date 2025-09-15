-- Add foreign key constraint between course_sections and clp_courses
ALTER TABLE course_sections 
ADD CONSTRAINT course_sections_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES clp_courses(id) 
ON DELETE CASCADE;