-- Ensure career-evidence storage bucket exists and has proper policies
-- Create career-evidence bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('career-evidence', 'career-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Admins and recruiters can view all evidence files" ON storage.objects;

-- Create RLS policies for career-evidence bucket
-- Users can upload their own evidence files
CREATE POLICY "Users can upload their own evidence files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own evidence files
CREATE POLICY "Users can view their own evidence files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own evidence files
CREATE POLICY "Users can update their own evidence files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own evidence files
CREATE POLICY "Users can delete their own evidence files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins and recruiters can view all evidence files for verification
CREATE POLICY "Admins and recruiters can view all evidence files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'career-evidence' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'recruiter', 'institute_admin')
    )
  )
);