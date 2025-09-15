-- Create enhanced course progress and learning goal update system

-- Function to get course progress (enhanced version)
CREATE OR REPLACE FUNCTION public.get_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS TABLE(
  total_chapters INTEGER,
  completed_chapters INTEGER,
  progress_percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH course_chapters_count AS (
    SELECT COUNT(*)::INTEGER as total
    FROM course_chapters cc
    JOIN course_sections cs ON cc.section_id = cs.id
    WHERE cs.course_id = p_course_id AND cc.is_active = true
  ),
  user_completed_count AS (
    SELECT COUNT(*)::INTEGER as completed
    FROM user_chapter_completions ucc
    JOIN course_chapters cc ON ucc.chapter_id = cc.id
    JOIN course_sections cs ON cc.section_id = cs.id
    WHERE cs.course_id = p_course_id 
      AND ucc.user_id = p_user_id
      AND cc.is_active = true
  )
  SELECT 
    ccc.total as total_chapters,
    ucc.completed as completed_chapters,
    CASE 
      WHEN ccc.total > 0 THEN ROUND((ucc.completed::DECIMAL / ccc.total::DECIMAL) * 100, 2)
      ELSE 0.00
    END as progress_percentage
  FROM course_chapters_count ccc
  CROSS JOIN user_completed_count ucc;
END;
$$;

-- Function to update learning goal progress when chapters are completed
CREATE OR REPLACE FUNCTION public.update_learning_goal_progress_on_chapter_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_record RECORD;
  progress_data RECORD;
  learning_goal_record RECORD;
BEGIN
  -- Get course info from the completed chapter
  SELECT cs.course_id, c.title as course_title
  INTO course_record
  FROM course_chapters cc
  JOIN course_sections cs ON cc.section_id = cs.id
  JOIN clp_courses c ON cs.course_id = c.id
  WHERE cc.id = NEW.chapter_id;
  
  -- Get progress for this course
  SELECT * INTO progress_data
  FROM public.get_course_progress(NEW.user_id, course_record.course_id);
  
  -- Find learning goal linked to this course
  SELECT * INTO learning_goal_record
  FROM learning_goals lg
  WHERE lg.user_id = NEW.user_id 
    AND lg.course_id::text = course_record.course_id::text
  LIMIT 1;
  
  -- Update learning goal progress if found
  IF learning_goal_record.id IS NOT NULL THEN
    UPDATE learning_goals
    SET 
      progress = progress_data.progress_percentage,
      status = CASE 
        WHEN progress_data.progress_percentage >= 100 THEN 'completed'
        WHEN progress_data.progress_percentage > 0 THEN 'in_progress'
        ELSE status
      END,
      updated_at = now()
    WHERE id = learning_goal_record.id;
    
    -- Award 100 points if course is fully completed (100%)
    IF progress_data.progress_percentage >= 100 AND NOT COALESCE(learning_goal_record.reward_points_awarded, false) THEN
      -- Award completion points
      INSERT INTO user_activity_points (
        user_id,
        activity_type,
        activity_id,
        points_earned,
        activity_date,
        created_at
      ) VALUES (
        NEW.user_id,
        'course_completion',
        course_record.course_id::text,
        100,
        CURRENT_DATE,
        now()
      );
      
      -- Mark learning goal as points awarded
      UPDATE learning_goals
      SET 
        reward_points_awarded = true,
        completion_bonus_points = 100,
        updated_at = now()
      WHERE id = learning_goal_record.id;
      
      -- Log successful completion
      RAISE NOTICE 'Course completion: User % completed course % and earned 100 points', NEW.user_id, course_record.course_title;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic learning goal progress updates
DROP TRIGGER IF EXISTS trigger_update_learning_goal_progress ON user_chapter_completions;
CREATE TRIGGER trigger_update_learning_goal_progress
  AFTER INSERT ON user_chapter_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_learning_goal_progress_on_chapter_completion();

-- Function to award learning goal completion points (enhanced)
CREATE OR REPLACE FUNCTION public.award_learning_goal_completion_points(p_learning_goal_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_record RECORD;
  course_progress_record RECORD;
  result JSON;
BEGIN
  -- Get learning goal details
  SELECT * INTO goal_record
  FROM learning_goals
  WHERE id = p_learning_goal_id;
  
  IF goal_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Learning goal not found'
    );
  END IF;
  
  -- Check if this is a course-linked goal
  IF goal_record.course_id IS NOT NULL THEN
    -- Get course progress
    SELECT * INTO course_progress_record
    FROM public.get_course_progress(goal_record.user_id, goal_record.course_id::uuid);
    
    -- Award points if course is 100% complete and points not already awarded
    IF course_progress_record.progress_percentage >= 100 AND NOT COALESCE(goal_record.reward_points_awarded, false) THEN
      -- Award points
      INSERT INTO user_activity_points (
        user_id,
        activity_type,
        activity_id,
        points_earned,
        activity_date,
        created_at
      ) VALUES (
        goal_record.user_id,
        'learning_goal_completion',
        p_learning_goal_id::text,
        100,
        CURRENT_DATE,
        now()
      );
      
      -- Update learning goal
      UPDATE learning_goals
      SET 
        reward_points_awarded = true,
        completion_bonus_points = 100,
        status = 'completed',
        progress = 100,
        updated_at = now()
      WHERE id = p_learning_goal_id;
      
      RETURN json_build_object(
        'success', true,
        'message', 'Learning goal completed! 100 points awarded.',
        'points_awarded', 100
      );
    ELSE
      RETURN json_build_object(
        'success', false,
        'message', 'Course not yet completed or points already awarded'
      );
    END IF;
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'This learning goal is not linked to a course'
    );
  END IF;
END;
$$;