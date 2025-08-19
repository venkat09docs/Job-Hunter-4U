-- Mark test@gmail.com as super admin
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
    
    -- Remove any existing roles for this user
    DELETE FROM public.user_roles 
    WHERE user_id = target_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::app_role);
    
    RAISE NOTICE 'Successfully assigned admin role to user: test@gmail.com';
    
END $$;