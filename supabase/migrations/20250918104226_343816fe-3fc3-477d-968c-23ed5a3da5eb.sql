-- Update the check constraint to include 'checklist' as a valid content type
ALTER TABLE public.course_chapters 
DROP CONSTRAINT course_chapters_content_type_check;

ALTER TABLE public.course_chapters 
ADD CONSTRAINT course_chapters_content_type_check 
CHECK (content_type = ANY (ARRAY['video'::text, 'article'::text, 'document'::text, 'checklist'::text]));