-- Add 'REJECTED' value to the verify_status enum
-- This will allow LinkedIn assignments to be properly rejected

ALTER TYPE verify_status ADD VALUE 'REJECTED';