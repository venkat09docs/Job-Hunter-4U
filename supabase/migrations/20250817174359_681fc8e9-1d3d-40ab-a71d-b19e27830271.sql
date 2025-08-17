-- Clean up orphaned user roles and then initialize notification preferences
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- First, clean up orphaned user roles (users that don't exist in auth.users)
    DELETE FROM public.user_roles 
    WHERE user_id NOT IN (
        SELECT id FROM auth.users
    );
    
    -- Then, initialize notification preferences for existing valid users
    FOR user_record IN 
        SELECT DISTINCT ur.user_id, ur.role 
        FROM public.user_roles ur
        INNER JOIN auth.users au ON ur.user_id = au.id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.notification_preferences np 
            WHERE np.user_id = ur.user_id
        )
    LOOP
        -- Initialize notification preferences for each user based on their role
        PERFORM initialize_notification_preferences(user_record.user_id, user_record.role);
    END LOOP;
END
$$;