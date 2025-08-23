-- Add evidence_data column to linkedin_evidence table to store tracking metrics
ALTER TABLE public.linkedin_evidence 
ADD COLUMN evidence_data JSONB DEFAULT '{}'::jsonb;