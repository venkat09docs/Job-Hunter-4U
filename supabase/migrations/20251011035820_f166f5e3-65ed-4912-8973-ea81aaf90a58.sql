-- Add base64 columns to saved_resumes table for persistent storage
ALTER TABLE saved_resumes 
ADD COLUMN IF NOT EXISTS pdf_base64 TEXT,
ADD COLUMN IF NOT EXISTS word_base64 TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN saved_resumes.pdf_base64 IS 'Base64 encoded PDF file data';
COMMENT ON COLUMN saved_resumes.word_base64 IS 'Base64 encoded Word document data';

-- Update existing records note: pdf_url and word_url will remain for backward compatibility
-- but new saves will use base64 columns