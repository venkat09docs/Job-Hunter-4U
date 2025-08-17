-- Initialize notification preferences for existing users
DO $$
DECLARE
    user_record RECORD;
    user_role_record RECORD;
BEGIN
    -- Loop through all existing users and initialize their notification preferences
    FOR user_record IN 
        SELECT DISTINCT ur.user_id, ur.role 
        FROM public.user_roles ur
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