-- Update the started attempt to submitted status
UPDATE clp_attempts 
SET 
  status = 'submitted',
  submitted_at = NOW()
WHERE id = 'da2a8a46-9ff7-4294-9414-90324744ddba' 
AND status = 'started';