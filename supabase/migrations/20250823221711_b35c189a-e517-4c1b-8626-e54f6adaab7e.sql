-- Create profile badges table for career achievements
CREATE TABLE IF NOT EXISTS public.profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  category TEXT NOT NULL DEFAULT 'profile',
  criteria JSONB NOT NULL DEFAULT '{}',
  points_required INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;

-- Create policies for profile badges
CREATE POLICY "Everyone can view active profile badges"
ON public.profile_badges
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage profile badges"
ON public.profile_badges
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create profile user badges junction table
CREATE TABLE IF NOT EXISTS public.profile_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.profile_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress_data JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.profile_user_badges ENABLE ROW LEVEL SECURITY;

-- Create policies for profile user badges
CREATE POLICY "Users can view their own profile badges"
ON public.profile_user_badges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can be awarded profile badges"
ON public.profile_user_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profile user badges"
ON public.profile_user_badges
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial profile badges
INSERT INTO public.profile_badges (code, title, description, icon, tier, category, criteria, points_required) VALUES
('profile_rookie', 'Profile Rookie', 'Start building your professional profile', '🥉', 'bronze', 'profile', '{"tasks_required": 1, "description": "Complete your first profile task"}', 10),
('profile_complete', 'Profile Complete', 'Completed all 9 profile building assignments', '🥈', 'silver', 'profile', '{"tasks_required": 9, "description": "Complete all 9 profile building tasks"}', 100),
('profile_perfectionist', 'Profile Perfectionist', 'Achieved profile perfection with optimized content', '🥇', 'gold', 'profile', '{"tasks_required": 9, "quality_score": 80, "description": "Complete all profile tasks with high quality"}', 200)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  tier = EXCLUDED.tier,
  criteria = EXCLUDED.criteria,
  points_required = EXCLUDED.points_required,
  updated_at = now();

-- Function to award profile badges based on completed tasks
CREATE OR REPLACE FUNCTION award_profile_badge_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when task is verified (completed)
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    -- Check if this completes a badge requirement
    PERFORM award_profile_badges_for_user(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award badges for a user
CREATE OR REPLACE FUNCTION award_profile_badges_for_user(user_uuid UUID)
RETURNS void AS $$
DECLARE
  completed_resume_tasks INTEGER;
  bronze_badge_id UUID;
  silver_badge_id UUID;
  gold_badge_id UUID;
BEGIN
  -- Count completed RESUME tasks for the user
  SELECT COUNT(*)
  INTO completed_resume_tasks
  FROM career_task_assignments cta
  JOIN career_task_templates ctt ON cta.template_id = ctt.id
  WHERE cta.user_id = user_uuid 
    AND cta.status = 'verified'
    AND ctt.module = 'RESUME'
    AND ctt.is_active = true;

  -- Get badge IDs
  SELECT id INTO bronze_badge_id FROM profile_badges WHERE code = 'profile_rookie';
  SELECT id INTO silver_badge_id FROM profile_badges WHERE code = 'profile_complete';
  SELECT id INTO gold_badge_id FROM profile_badges WHERE code = 'profile_perfectionist';

  -- Award Bronze badge (Profile Rookie) - for completing first task
  IF completed_resume_tasks >= 1 AND bronze_badge_id IS NOT NULL THEN
    INSERT INTO profile_user_badges (user_id, badge_id, progress_data)
    VALUES (user_uuid, bronze_badge_id, jsonb_build_object('completed_tasks', completed_resume_tasks))
    ON CONFLICT (user_id, badge_id) DO UPDATE SET
      progress_data = jsonb_build_object('completed_tasks', completed_resume_tasks),
      awarded_at = now();
  END IF;

  -- Award Silver badge (Profile Complete) - for completing all 9 tasks
  IF completed_resume_tasks >= 9 AND silver_badge_id IS NOT NULL THEN
    INSERT INTO profile_user_badges (user_id, badge_id, progress_data)
    VALUES (user_uuid, silver_badge_id, jsonb_build_object('completed_tasks', completed_resume_tasks))
    ON CONFLICT (user_id, badge_id) DO UPDATE SET
      progress_data = jsonb_build_object('completed_tasks', completed_resume_tasks),
      awarded_at = now();
  END IF;

  -- Award Gold badge (Profile Perfectionist) - for completing all tasks with high quality
  -- For now, same as silver until we implement quality scoring
  IF completed_resume_tasks >= 9 AND gold_badge_id IS NOT NULL THEN
    INSERT INTO profile_user_badges (user_id, badge_id, progress_data)
    VALUES (user_uuid, gold_badge_id, jsonb_build_object('completed_tasks', completed_resume_tasks))
    ON CONFLICT (user_id, badge_id) DO UPDATE SET
      progress_data = jsonb_build_object('completed_tasks', completed_resume_tasks),
      awarded_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to award badges when assignments are completed
CREATE OR REPLACE TRIGGER award_profile_badge_trigger
  AFTER UPDATE ON career_task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION award_profile_badge_on_completion();

-- Award badges for existing users who already have completed tasks
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM career_task_assignments 
    WHERE status = 'verified'
  LOOP
    PERFORM award_profile_badges_for_user(user_record.user_id);
  END LOOP;
END $$;