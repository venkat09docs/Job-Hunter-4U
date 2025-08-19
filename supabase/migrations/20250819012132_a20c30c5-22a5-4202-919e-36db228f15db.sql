-- Create storage bucket for LinkedIn evidence files
INSERT INTO storage.buckets (id, name, public)
VALUES ('linkedin-evidence', 'linkedin-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for LinkedIn evidence
CREATE POLICY "Users can upload own evidence files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'linkedin-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own evidence files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'linkedin-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own evidence files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'linkedin-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage all evidence files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'linkedin-evidence' 
  AND has_role(auth.uid(), 'admin'::app_role)
);