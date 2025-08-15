-- Enable realtime for all relevant tables that need synchronization
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.resume_data REPLICA IDENTITY FULL;
ALTER TABLE public.linkedin_progress REPLICA IDENTITY FULL;
ALTER TABLE public.github_progress REPLICA IDENTITY FULL;
ALTER TABLE public.job_tracker REPLICA IDENTITY FULL;
ALTER TABLE public.linkedin_network_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.daily_progress_snapshots REPLICA IDENTITY FULL;

-- Add tables to realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resume_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.linkedin_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.github_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_tracker;
ALTER PUBLICATION supabase_realtime ADD TABLE public.linkedin_network_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_progress_snapshots;