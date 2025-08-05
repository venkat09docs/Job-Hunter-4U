-- Check if trigger exists and recreate if needed
DO $$ 
BEGIN
    -- Drop trigger if it exists
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Create the trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW 
        EXECUTE FUNCTION public.handle_new_user_with_webhook();
        
    -- Log success
    RAISE NOTICE 'Trigger on_auth_user_created created successfully';
END $$;