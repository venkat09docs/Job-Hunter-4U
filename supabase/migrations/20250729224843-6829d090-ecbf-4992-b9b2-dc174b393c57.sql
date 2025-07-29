-- Update existing profiles where username is null to use full_name as username
UPDATE profiles 
SET username = full_name, updated_at = now()
WHERE username IS NULL AND full_name IS NOT NULL;