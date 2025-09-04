-- Create the database function to handle social proof event creation
CREATE OR REPLACE FUNCTION create_social_proof_event(
    p_user_id UUID DEFAULT NULL,
    p_event_type TEXT,
    p_event_data JSONB DEFAULT '{}'::jsonb,
    p_user_first_name TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_event_id UUID;
    display_text TEXT;
BEGIN
    -- Generate display text based on event type
    CASE p_event_type
        WHEN 'job_application' THEN
            IF p_user_first_name IS NOT NULL THEN
                display_text := p_user_first_name || ' just applied to ' || 
                    COALESCE(p_event_data->>'company', 'a company') || 
                    CASE WHEN p_event_data->>'job_title' IS NOT NULL 
                         THEN ' for ' || (p_event_data->>'job_title') 
                         ELSE '' END;
            ELSE
                display_text := 'Someone just applied to ' || 
                    COALESCE(p_event_data->>'company', 'a company') || 
                    CASE WHEN p_event_data->>'job_title' IS NOT NULL 
                         THEN ' for ' || (p_event_data->>'job_title') 
                         ELSE '' END;
            END IF;
        WHEN 'premium_upgrade' THEN
            IF p_user_first_name IS NOT NULL THEN
                display_text := p_user_first_name || ' just upgraded to ' || 
                    COALESCE(p_event_data->>'plan_name', 'Premium');
            ELSE
                display_text := 'Someone just upgraded to ' || 
                    COALESCE(p_event_data->>'plan_name', 'Premium');
            END IF;
        WHEN 'resume_completion' THEN
            IF p_user_first_name IS NOT NULL THEN
                display_text := p_user_first_name || ' just completed their resume!';
            ELSE
                display_text := 'Someone just completed their resume!';
            END IF;
        WHEN 'linkedin_optimization' THEN
            IF p_user_first_name IS NOT NULL THEN
                display_text := p_user_first_name || ' just optimized their LinkedIn profile!';
            ELSE
                display_text := 'Someone just optimized their LinkedIn profile!';
            END IF;
        WHEN 'github_setup' THEN
            IF p_user_first_name IS NOT NULL THEN
                display_text := p_user_first_name || ' just set up their GitHub profile!';
            ELSE
                display_text := 'Someone just set up their GitHub profile!';
            END IF;
        ELSE
            IF p_user_first_name IS NOT NULL THEN
                display_text := p_user_first_name || ' just completed an activity!';
            ELSE
                display_text := 'Someone just completed an activity!';
            END IF;
    END CASE;

    -- Insert the new social proof event
    INSERT INTO social_proof_events (
        user_id,
        event_type,
        event_data,
        display_text,
        user_first_name,
        location,
        is_active,
        created_at
    ) VALUES (
        p_user_id,
        p_event_type,
        p_event_data,
        display_text,
        p_user_first_name,
        p_location,
        true,
        NOW()
    ) RETURNING id INTO new_event_id;

    RETURN new_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;