-- Create storage bucket for HR documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('hr-documents', 'hr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for hr-documents bucket
CREATE POLICY "Users can upload their own HR documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hr-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own HR documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'hr-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own HR documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hr-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own HR documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'hr-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);