-- First, let's check if test4 and kent users exist and get their user_ids
DO $$
DECLARE
    test4_user_id uuid;
    kent_user_id uuid;
    rns_institute_id uuid;
    it_batch_id uuid;
BEGIN
    -- Get user IDs for test4 and kent
    SELECT user_id INTO test4_user_id FROM profiles WHERE username = 'test4' OR email = 'test4@example.com' LIMIT 1;
    SELECT user_id INTO kent_user_id FROM profiles WHERE username = 'kent' OR email = 'kent@example.com' LIMIT 1;
    
    -- Get RNS Tech institute ID
    SELECT id INTO rns_institute_id FROM institutes WHERE name = 'RNS Tech' LIMIT 1;
    
    -- Get IT batch ID for RNS Tech
    SELECT id INTO it_batch_id FROM batches WHERE institute_id = rns_institute_id AND code = 'IT-1' LIMIT 1;
    
    -- Assign test4 to RNS Tech Institute if user exists and not already assigned
    IF test4_user_id IS NOT NULL AND rns_institute_id IS NOT NULL AND it_batch_id IS NOT NULL THEN
        INSERT INTO user_assignments (user_id, institute_id, batch_id, assignment_type, is_active, assigned_at)
        VALUES (test4_user_id, rns_institute_id, it_batch_id, 'batch', true, now())
        ON CONFLICT (user_id, institute_id, batch_id, assignment_type) WHERE is_active = true
        DO UPDATE SET assigned_at = now();
        
        RAISE NOTICE 'Assigned test4 (%) to RNS Tech Institute (%) and IT batch (%)', test4_user_id, rns_institute_id, it_batch_id;
    END IF;
    
    -- Assign kent to RNS Tech Institute if user exists and not already assigned
    IF kent_user_id IS NOT NULL AND rns_institute_id IS NOT NULL AND it_batch_id IS NOT NULL THEN
        INSERT INTO user_assignments (user_id, institute_id, batch_id, assignment_type, is_active, assigned_at)
        VALUES (kent_user_id, rns_institute_id, it_batch_id, 'batch', true, now())
        ON CONFLICT (user_id, institute_id, batch_id, assignment_type) WHERE is_active = true
        DO UPDATE SET assigned_at = now();
        
        RAISE NOTICE 'Assigned kent (%) to RNS Tech Institute (%) and IT batch (%)', kent_user_id, rns_institute_id, it_batch_id;
    END IF;
    
    -- Provide feedback on what was found
    IF test4_user_id IS NULL THEN
        RAISE NOTICE 'test4 user not found in profiles table';
    END IF;
    
    IF kent_user_id IS NULL THEN
        RAISE NOTICE 'kent user not found in profiles table';
    END IF;
    
    IF rns_institute_id IS NULL THEN
        RAISE NOTICE 'RNS Tech institute not found';
    END IF;
    
    IF it_batch_id IS NULL THEN
        RAISE NOTICE 'IT batch not found for RNS Tech';
    END IF;
END $$;