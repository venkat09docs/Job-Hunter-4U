-- Manually assign recent users to RNS Tech Institute who weren't auto-assigned
INSERT INTO user_assignments (user_id, institute_id, batch_id, assignment_type, is_active)
SELECT 
    p.user_id,
    '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80'::uuid as institute_id, -- RNS Tech Institute
    CASE 
        WHEN p.industry = 'IT' THEN 'acd2af9d-b906-4dc8-a250-fc5e47736e6a'::uuid  -- IT Batch
        ELSE '37bb5110-42d7-43ea-8854-b2bfee404dd8'::uuid  -- Non-IT Batch
    END as batch_id,
    'manual_fix' as assignment_type,
    true as is_active
FROM profiles p
WHERE p.created_at >= NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = p.user_id 
        AND ua.is_active = true
    );