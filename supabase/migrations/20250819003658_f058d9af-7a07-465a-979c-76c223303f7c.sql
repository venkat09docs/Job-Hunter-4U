-- Create storage bucket for career task evidence files
INSERT INTO storage.buckets (id, name, public) VALUES ('career-evidence', 'career-evidence', false);

-- Create storage policies for career evidence bucket
CREATE POLICY "Users can upload their own evidence files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'career-evidence' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.career_task_assignments cta 
    WHERE cta.user_id = auth.uid() 
    AND cta.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Users can view their own evidence files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'career-evidence'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own evidence files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'career-evidence'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own evidence files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'career-evidence'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage all evidence files"
ON storage.objects FOR ALL
USING (bucket_id = 'career-evidence' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'career-evidence' AND has_role(auth.uid(), 'admin'::app_role));