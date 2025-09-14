-- Add order_index and industry_type columns to clp_courses table
ALTER TABLE public.clp_courses
ADD COLUMN order_index INTEGER DEFAULT 0,
ADD COLUMN industry_type TEXT DEFAULT 'both' CHECK (industry_type IN ('IT', 'non-IT', 'both'));