-- Create table to track user chapter completions
CREATE TABLE public.user_chapter_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chapter_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Enable RLS
ALTER TABLE public.user_chapter_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chapter completions" 
ON public.user_chapter_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chapter completions" 
ON public.user_chapter_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chapter completions" 
ON public.user_chapter_completions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_user_chapter_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_chapter_completions_updated_at
BEFORE UPDATE ON public.user_chapter_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_chapter_completions_updated_at();

-- Add course_id to learning_goals table for linking to courses
ALTER TABLE public.learning_goals 
ADD COLUMN course_id UUID,
ADD COLUMN reward_points_awarded BOOLEAN DEFAULT false,
ADD COLUMN completion_bonus_points INTEGER DEFAULT 0;

-- Create function to calculate course progress for a user
CREATE OR REPLACE FUNCTION public.get_course_progress(p_user_id uuid, p_course_id uuid)
RETURNS TABLE(
  total_chapters integer,
  completed_chapters integer,
  progress_percentage numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH course_chapters AS (
    SELECT COUNT(*)::integer as total
    FROM course_chapters cc
    JOIN course_sections cs ON cc.section_id = cs.id
    WHERE cs.course_id = p_course_id 
      AND cc.is_active = true 
      AND cs.is_active = true
  ),
  user_completions AS (
    SELECT COUNT(*)::integer as completed
    FROM user_chapter_completions ucc
    JOIN course_chapters cc ON ucc.chapter_id = cc.id
    JOIN course_sections cs ON cc.section_id = cs.id
    WHERE ucc.user_id = p_user_id 
      AND cs.course_id = p_course_id
      AND cc.is_active = true 
      AND cs.is_active = true
  )
  SELECT 
    course_chapters.total,
    user_completions.completed,
    CASE 
      WHEN course_chapters.total > 0 THEN 
        ROUND((user_completions.completed::numeric / course_chapters.total::numeric) * 100, 2)
      ELSE 0
    END as progress_percentage
  FROM course_chapters, user_completions;
END;
$$;

-- Create function to award completion points for learning goals
CREATE OR REPLACE FUNCTION public.award_learning_goal_completion_points(p_learning_goal_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_record RECORD;
  progress_data RECORD;
  points_to_award INTEGER := 0;
  result JSON;
BEGIN
  -- Get learning goal details
  SELECT * INTO goal_record
  FROM learning_goals
  WHERE id = p_learning_goal_id;
  
  IF goal_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Learning goal not found');
  END IF;
  
  -- Check if points already awarded
  IF goal_record.reward_points_awarded = true THEN
    RETURN json_build_object('success', false, 'message', 'Points already awarded for this goal');
  END IF;
  
  -- Get course progress if course_id is set
  IF goal_record.course_id IS NOT NULL THEN
    SELECT * INTO progress_data
    FROM get_course_progress(goal_record.user_id, goal_record.course_id);
    
    -- Check if course is 100% complete
    IF progress_data.progress_percentage >= 100 THEN
      -- Determine points based on completion timeline
      IF goal_record.end_date >= CURRENT_DATE THEN
        points_to_award := 100; -- Completed within timeline
      ELSE
        points_to_award := 25;  -- Completed after timeline
      END IF;
      
      -- Award points
      INSERT INTO user_activity_points (user_id, activity_type, activity_id, points_earned, activity_date)
      VALUES (goal_record.user_id, 'learning_goal_completion', p_learning_goal_id::text, points_to_award, CURRENT_DATE);
      
      -- Update learning goal
      UPDATE learning_goals
      SET 
        progress = 100,
        status = 'completed',
        reward_points_awarded = true,
        completion_bonus_points = points_to_award,
        updated_at = now()
      WHERE id = p_learning_goal_id;
      
      result := json_build_object(
        'success', true, 
        'points_awarded', points_to_award,
        'message', 'Learning goal completed and points awarded'
      );
    ELSE
      -- Update progress but don't award points yet
      UPDATE learning_goals
      SET 
        progress = progress_data.progress_percentage,
        updated_at = now()
      WHERE id = p_learning_goal_id;
      
      result := json_build_object(
        'success', true, 
        'progress_updated', progress_data.progress_percentage,
        'message', 'Progress updated, course not yet complete'
      );
    END IF;
  ELSE
    result := json_build_object('success', false, 'message', 'No course linked to this learning goal');
  END IF;
  
  RETURN result;
END;
$$;