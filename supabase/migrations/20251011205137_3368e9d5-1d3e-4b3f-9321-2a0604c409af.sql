-- Add analysis_report column to hr_details table
ALTER TABLE hr_details ADD COLUMN IF NOT EXISTS analysis_report TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_hr_details_analysis_report ON hr_details(id) WHERE analysis_report IS NOT NULL;