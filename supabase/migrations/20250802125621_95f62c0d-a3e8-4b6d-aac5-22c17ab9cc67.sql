-- Create storage bucket for AI tool images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tool-images', 'tool-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for tool image uploads
CREATE POLICY "Tool images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tool-images');

CREATE POLICY "Admins can upload tool images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'tool-images');

CREATE POLICY "Admins can update tool images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tool-images');

CREATE POLICY "Admins can delete tool images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'tool-images');