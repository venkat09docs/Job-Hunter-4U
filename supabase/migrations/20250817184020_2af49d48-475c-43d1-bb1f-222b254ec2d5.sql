-- Add industry field to profiles table
ALTER TABLE public.profiles ADD COLUMN industry text CHECK (industry IN ('IT', 'Non-IT')) DEFAULT 'IT';

-- Add index for performance
CREATE INDEX idx_profiles_industry ON public.profiles(industry);

-- Update existing users to default to IT industry (backward compatibility)
UPDATE public.profiles SET industry = 'IT' WHERE industry IS NULL;