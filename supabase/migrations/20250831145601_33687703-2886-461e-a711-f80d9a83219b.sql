-- Add foreign key constraint between affiliate_users and profiles
ALTER TABLE public.affiliate_users 
ADD CONSTRAINT fk_affiliate_users_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;