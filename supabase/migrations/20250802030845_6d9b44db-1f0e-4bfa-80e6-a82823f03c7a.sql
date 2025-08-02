-- Rename and update the table for daily progress snapshots
ALTER TABLE public.weekly_progress_snapshots 
RENAME TO daily_progress_snapshots;

-- Update column names for daily tracking
ALTER TABLE public.daily_progress_snapshots 
RENAME COLUMN week_start_date TO snapshot_date;

ALTER TABLE public.daily_progress_snapshots 
DROP COLUMN week_end_date;

-- Update the unique constraint for daily tracking
ALTER TABLE public.daily_progress_snapshots 
DROP CONSTRAINT weekly_progress_snapshots_user_id_week_start_date_key;

ALTER TABLE public.daily_progress_snapshots 
ADD CONSTRAINT daily_progress_snapshots_user_id_snapshot_date_key 
UNIQUE (user_id, snapshot_date);

-- Update RLS policies with new table name
DROP POLICY "Users can view their own weekly snapshots" ON public.daily_progress_snapshots;
DROP POLICY "Edge functions can insert weekly snapshots" ON public.daily_progress_snapshots;
DROP POLICY "Edge functions can update weekly snapshots" ON public.daily_progress_snapshots;

CREATE POLICY "Users can view their own daily snapshots" 
ON public.daily_progress_snapshots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can insert daily snapshots" 
ON public.daily_progress_snapshots 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update daily snapshots" 
ON public.daily_progress_snapshots 
FOR UPDATE 
USING (true);

-- Update trigger name
DROP TRIGGER update_weekly_snapshots_updated_at ON public.daily_progress_snapshots;

CREATE TRIGGER update_daily_snapshots_updated_at
BEFORE UPDATE ON public.daily_progress_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();