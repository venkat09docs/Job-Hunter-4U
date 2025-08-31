-- Make the career-evidence bucket public so files can be accessed via public URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'career-evidence';

-- Also add file size limit for security (50MB max)
UPDATE storage.buckets 
SET file_size_limit = 52428800 
WHERE id = 'career-evidence';