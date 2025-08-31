-- Create RLS policies for career evidence bucket
DO $$
BEGIN
  -- Check if policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own evidence files'
  ) THEN
    CREATE POLICY "Users can upload their own evidence files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'career-evidence' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view their own evidence files'
  ) THEN
    CREATE POLICY "Users can view their own evidence files"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'career-evidence' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own evidence files'
  ) THEN
    CREATE POLICY "Users can update their own evidence files"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'career-evidence' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own evidence files'
  ) THEN
    CREATE POLICY "Users can delete their own evidence files"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'career-evidence' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END
$$;