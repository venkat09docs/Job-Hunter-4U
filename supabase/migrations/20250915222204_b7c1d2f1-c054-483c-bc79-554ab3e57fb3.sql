-- First migration: Add 'available' status to attempt_status enum
ALTER TYPE attempt_status ADD VALUE 'available';