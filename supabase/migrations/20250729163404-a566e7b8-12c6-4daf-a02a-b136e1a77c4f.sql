-- Update profiles table to populate email from auth.users for existing users
-- This will help resolve the "Unknown Student" issue

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users who have profiles but missing email
    FOR user_record IN 
        SELECT p.user_id, au.email, au.raw_user_meta_data->>'full_name' as meta_full_name
        FROM profiles p
        JOIN auth.users au ON p.user_id = au.id
        WHERE p.email IS NULL OR p.email = ''
    LOOP
        -- Update profile with email and full_name from auth.users
        UPDATE profiles 
        SET 
            email = user_record.email,
            full_name = COALESCE(full_name, user_record.meta_full_name, user_record.email)
        WHERE user_id = user_record.user_id;
    END LOOP;
END $$;