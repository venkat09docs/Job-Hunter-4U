-- Create storage bucket for job applications
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-applications',
  'job-applications',
  true,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own job application files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-applications' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view their own job application files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-applications' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own job application files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-applications' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);