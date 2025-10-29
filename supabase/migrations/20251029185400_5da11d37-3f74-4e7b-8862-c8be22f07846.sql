-- Add categories column to clp_courses table to support multiple categories per course
ALTER TABLE clp_courses
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Update existing courses to have their category in the categories array if they don't already
UPDATE clp_courses
SET categories = ARRAY[category]
WHERE category IS NOT NULL 
  AND category != ''
  AND (categories IS NULL OR categories = '{}');