-- Add phone number field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT;