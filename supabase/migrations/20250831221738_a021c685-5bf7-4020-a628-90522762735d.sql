-- Phase 1A: Enhance notifications table structure
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_url text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Enhance notification preferences with email support
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS email_enabled boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS email_frequency text DEFAULT 'immediate';
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS app_enabled boolean DEFAULT true;