-- Check if policies exist and create them if they don't
-- First, let's see what policies exist on storage.objects for the career-evidence bucket

-- Create RLS policies for career evidence bucket (will ignore if they already exist)
CREATE POLICY IF NOT EXISTS "Users can upload their own evidence files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can view their own evidence files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own evidence files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own evidence files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);