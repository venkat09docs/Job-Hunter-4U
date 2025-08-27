-- Clean up duplicate assignments and fix week start dates
-- First, let's delete assignments with incorrect week start dates (not Monday)
DELETE FROM job_hunting_assignments 
WHERE week_start_date = '2025-08-26'  -- Tuesday, should be Monday (2025-08-25)
   OR week_start_date = '2025-08-27'  -- Wednesday, should be Monday (2025-08-25)
   OR EXTRACT(DOW FROM week_start_date) != 1;  -- Remove any non-Monday week starts

-- Ensure we have the correct week start date for current week
-- Current week should start on Monday 2025-08-25
UPDATE job_hunting_assignments 
SET week_start_date = '2025-08-25' 
WHERE week_start_date >= '2025-08-25' 
  AND week_start_date <= '2025-08-31'
  AND EXTRACT(DOW FROM week_start_date) != 1;