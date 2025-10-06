-- Add telegram_chat_id column to profiles table for Telegram authentication integration
ALTER TABLE public.profiles 
ADD COLUMN telegram_chat_id TEXT;

-- Add index for faster lookups by telegram_chat_id
CREATE INDEX idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.telegram_chat_id IS 'Telegram chat ID for users who authenticate via Telegram magic links';