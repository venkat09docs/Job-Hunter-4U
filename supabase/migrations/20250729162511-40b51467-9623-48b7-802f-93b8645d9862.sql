-- Add email column to profiles table to store user emails for management purposes
ALTER TABLE public.profiles ADD COLUMN email TEXT;