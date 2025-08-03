-- Update job_searches table to store search results properly
ALTER TABLE job_searches 
ALTER COLUMN results TYPE jsonb USING results::jsonb;

-- Update job_searches table to have better structure
COMMENT ON TABLE job_searches IS 'Stores job search queries and their results for user reference';