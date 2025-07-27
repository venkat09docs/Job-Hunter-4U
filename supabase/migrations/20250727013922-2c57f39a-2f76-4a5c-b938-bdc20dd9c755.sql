-- Add personal information fields to portfolios table
ALTER TABLE public.portfolios 
ADD COLUMN full_name TEXT,
ADD COLUMN email TEXT, 
ADD COLUMN phone TEXT,
ADD COLUMN location TEXT;