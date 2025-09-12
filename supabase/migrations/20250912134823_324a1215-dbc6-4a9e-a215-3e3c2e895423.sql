-- Create storage bucket for course images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-images', 'course-images', true);

-- Create policies for course image uploads
CREATE POLICY "Course images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-images');

CREATE POLICY "Authenticated users can upload course images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update course images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete course images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');