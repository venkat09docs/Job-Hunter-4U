-- Fix orphaned LinkedIn tasks by updating them to the correct user
UPDATE linkedin_user_tasks 
SET user_id = 'c3e464f8-840a-4129-8d83-45f4f3c1f186'
WHERE user_id = '4a62c5d6-46d3-43e0-acd2-5c0c31b1be61'
AND id IN ('8cc0f413-9440-4038-a4d4-1f23d3e77751', '4c11156a-1ea7-4dfb-87ad-bd85e51f46dd', '42730591-8cdd-409e-b6e2-b10d238f8625', 'f914af01-b193-4f17-ada6-8159f1446a90');

-- Create or update linkedin_users entry for SushmaRam if it doesn't exist
INSERT INTO linkedin_users (auth_uid, name, email) 
VALUES ('c3e464f8-840a-4129-8d83-45f4f3c1f186', 'sushmaram', 'sushmaram@example.com')
ON CONFLICT (auth_uid) DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email;