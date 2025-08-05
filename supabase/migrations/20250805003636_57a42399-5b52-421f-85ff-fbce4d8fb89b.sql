-- Test the trigger function directly
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
BEGIN
    -- Try to execute the trigger function manually to see if it works
    RAISE LOG 'Testing trigger function manually with test user ID: %', test_user_id;
    
    -- Insert a test record to see if trigger fires
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        test_user_id,
        'test-webhook-trigger@example.com',
        crypt('testpassword', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"full_name": "Test Webhook User", "username": "testwebhook"}'::jsonb,
        false,
        'authenticated'
    );
    
    RAISE LOG 'Test user inserted with ID: %', test_user_id;
    
    -- Clean up immediately
    DELETE FROM auth.users WHERE id = test_user_id;
    RAISE LOG 'Test user cleaned up';
END $$;