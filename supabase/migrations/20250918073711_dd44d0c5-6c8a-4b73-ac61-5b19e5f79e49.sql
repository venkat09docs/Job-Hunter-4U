-- Create storage bucket for question attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('question-attachments', 'question-attachments', true);

-- Create policies for question attachments bucket
CREATE POLICY "Question attachments are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'question-attachments');

CREATE POLICY "Admins and recruiters can upload question attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'question-attachments' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'recruiter'::app_role) 
    OR has_role(auth.uid(), 'institute_admin'::app_role)
  )
);

CREATE POLICY "Admins and recruiters can update question attachments" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'question-attachments' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'recruiter'::app_role) 
    OR has_role(auth.uid(), 'institute_admin'::app_role)
  )
);

CREATE POLICY "Admins and recruiters can delete question attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'question-attachments' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'recruiter'::app_role) 
    OR has_role(auth.uid(), 'institute_admin'::app_role)
  )
);