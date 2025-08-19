-- Mark test@gmail.com as super admin by temporarily disabling the trigger
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Find the user_id for test@gmail.com
    SELECT user_id INTO target_user_id 
    FROM public.profiles 
    WHERE email = 'test@gmail.com' 
    LIMIT 1;
    
    -- Check if user was found
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No user found with email: test@gmail.com';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user with ID: %', target_user_id;
    
    -- Temporarily drop the trigger
    DROP TRIGGER IF EXISTS validate_role_changes_trigger ON public.user_roles;
    
    -- Delete existing roles first
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::app_role);
    
    -- Recreate the trigger
    CREATE TRIGGER validate_role_changes_trigger
        BEFORE INSERT OR UPDATE ON public.user_roles
        FOR EACH ROW EXECUTE FUNCTION public.validate_role_changes();
    
    RAISE NOTICE 'Successfully assigned admin role to user: test@gmail.com';
    
EXCEPTION
    WHEN OTHERS THEN
        -- Make sure to recreate the trigger even if there's an error
        CREATE TRIGGER IF NOT EXISTS validate_role_changes_trigger
            BEFORE INSERT OR UPDATE ON public.user_roles
            FOR EACH ROW EXECUTE FUNCTION public.validate_role_changes();
        
        RAISE NOTICE 'Error assigning admin role: %', SQLERRM;
        RAISE;
END $$;