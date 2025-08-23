-- Update the verify_status enum to include STARTED
ALTER TYPE verify_status ADD VALUE IF NOT EXISTS 'STARTED' BEFORE 'SUBMITTED';