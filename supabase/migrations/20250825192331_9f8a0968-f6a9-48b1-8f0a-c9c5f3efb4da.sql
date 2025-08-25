-- Add storage policy to allow admins and institute admins to view evidence files during verification
CREATE POLICY "Admins and Institute Admins can view evidence files for verification"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'career-evidence'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'institute_admin'::app_role)
      OR has_role(auth.uid(), 'recruiter'::app_role)
    )
  );