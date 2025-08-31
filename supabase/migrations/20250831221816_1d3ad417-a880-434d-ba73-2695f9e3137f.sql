-- Phase 1B: Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text NOT NULL UNIQUE,
  title_template text NOT NULL,
  message_template text NOT NULL,
  email_subject_template text,
  email_body_template text,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create notification delivery log for tracking
CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  delivery_type text NOT NULL, -- 'app', 'email'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  error_message text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_templates
CREATE POLICY "Everyone can view active templates" ON public.notification_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage notification templates" ON public.notification_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for notification_delivery_log  
CREATE POLICY "Users can view their own delivery logs" ON public.notification_delivery_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.id = notification_delivery_log.notification_id 
      AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage delivery logs" ON public.notification_delivery_log
  FOR ALL USING (true) WITH CHECK (true);