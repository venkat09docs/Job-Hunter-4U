-- Add 'embed_code' to the content_type check constraint
ALTER TABLE course_chapters DROP CONSTRAINT IF EXISTS course_chapters_content_type_check;

ALTER TABLE course_chapters ADD CONSTRAINT course_chapters_content_type_check 
CHECK (content_type IN ('video', 'article', 'document', 'checklist', 'embed_code'));