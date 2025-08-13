-- Ensure only one session per user per day and lock completed sessions

-- 1) Unique constraint on (user_id, session_date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'github_daily_flow_sessions_user_date_key'
  ) THEN
    ALTER TABLE public.github_daily_flow_sessions
    ADD CONSTRAINT github_daily_flow_sessions_user_date_key UNIQUE (user_id, session_date);
  END IF;
END $$;

-- 2) Prevent updates to a session after it is completed
CREATE OR REPLACE FUNCTION public.prevent_update_on_completed_sessions()
RETURNS trigger AS $$
BEGIN
  IF OLD.completed = true THEN
    RAISE EXCEPTION 'Completed sessions cannot be modified';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_prevent_update_on_completed_sessions ON public.github_daily_flow_sessions;
CREATE TRIGGER trg_prevent_update_on_completed_sessions
BEFORE UPDATE ON public.github_daily_flow_sessions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_update_on_completed_sessions();