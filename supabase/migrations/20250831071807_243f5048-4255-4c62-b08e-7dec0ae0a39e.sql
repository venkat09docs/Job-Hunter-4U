-- Create storage bucket for career task evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-evidence', 'career-evidence', false);

-- Create RLS policies for career evidence bucket
CREATE POLICY "Users can upload their own evidence files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own evidence files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own evidence files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own evidence files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);