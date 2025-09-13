-- Update the trigger function to use 'batch' assignment type instead of 'institute'
CREATE OR REPLACE FUNCTION public.assign_new_users_to_rns_tech()
RETURNS TRIGGER AS $$
DECLARE
    rns_institute_id uuid;
    it_batch_id uuid;
BEGIN
    -- Get RNS Tech Institute ID
    SELECT id INTO rns_institute_id 
    FROM institutes 
    WHERE name = 'RNS Tech' 
    LIMIT 1;
    
    -- Get IT batch ID for RNS Tech
    SELECT id INTO it_batch_id 
    FROM batches 
    WHERE institute_id = rns_institute_id 
    AND code = 'IT-1' 
    LIMIT 1;
    
    -- Only proceed if both institute and batch exist
    IF rns_institute_id IS NOT NULL AND it_batch_id IS NOT NULL THEN
        -- Assign user to RNS Tech Institute and IT batch
        INSERT INTO user_assignments (
            user_id,
            institute_id,
            batch_id,
            assignment_type,
            is_active,
            assigned_at
        ) VALUES (
            NEW.user_id,
            rns_institute_id,
            it_batch_id,
            'batch',  -- Changed from 'institute' to 'batch'
            true,
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;