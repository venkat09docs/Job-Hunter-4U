-- Enable realtime for user_activity_points table
ALTER TABLE public.user_activity_points REPLICA IDENTITY FULL;

-- Add the table to the realtime publication if not already added
-- This ensures real-time updates are broadcast to subscribed clients
DO $$
BEGIN
    -- Add table to realtime publication
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_points';
EXCEPTION
    WHEN duplicate_object THEN
        -- Table already in publication, do nothing
        NULL;
END $$;