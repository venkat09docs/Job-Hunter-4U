-- Check if github-evidence bucket exists, if not create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('github-evidence', 'github-evidence', true, 10485760, '{"image/*","application/pdf","text/*","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}')
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = '{"image/*","application/pdf","text/*","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}';

-- Create RLS policies for github-evidence bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own github evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own github evidence" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all github evidence" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters can view all github evidence" ON storage.objects;

-- Allow authenticated users to upload to github-evidence folder with their user ID
CREATE POLICY "Users can upload their own github evidence" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'github-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view/download their own github evidence
CREATE POLICY "Users can view their own github evidence" ON storage.objects
FOR SELECT USING (
  bucket_id = 'github-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all github evidence
CREATE POLICY "Admins can view all github evidence" ON storage.objects
FOR SELECT USING (
  bucket_id = 'github-evidence' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow recruiters to view all github evidence
CREATE POLICY "Recruiters can view all github evidence" ON storage.objects
FOR SELECT USING (
  bucket_id = 'github-evidence' 
  AND has_role(auth.uid(), 'recruiter'::app_role)
);

-- Allow institute admins to view github evidence from their assigned institutes
CREATE POLICY "Institute admins can view github evidence from their institutes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'github-evidence' 
  AND has_role(auth.uid(), 'institute_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM user_assignments ua
    INNER JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = ((storage.foldername(name))[1])::uuid
    AND iaa.user_id = auth.uid()
    AND iaa.is_active = true
    AND ua.is_active = true
  )
);

-- Allow users to update their own github evidence (for replacements)
CREATE POLICY "Users can update their own github evidence" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'github-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own github evidence
CREATE POLICY "Users can delete their own github evidence" ON storage.objects
FOR DELETE USING (
  bucket_id = 'github-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);