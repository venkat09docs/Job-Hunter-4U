-- Fix webhook_queue table RLS policies to prevent public access to user emails
-- Drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Service role can manage webhook queue" ON public.webhook_queue;

-- Create secure RLS policies for webhook_queue
-- Only allow service role and edge functions to manage webhook data
CREATE POLICY "Service role can manage webhook queue" 
ON public.webhook_queue 
FOR ALL 
TO service_role 
USING (true);

-- Allow authenticated users to view only their own webhook queue entries
CREATE POLICY "Users can view their own webhook queue entries" 
ON public.webhook_queue 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Ensure RLS is enabled on the webhook_queue table
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;