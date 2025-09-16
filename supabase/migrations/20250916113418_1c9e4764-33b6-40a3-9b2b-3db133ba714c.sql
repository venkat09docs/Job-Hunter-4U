-- Create the missing auto_grade_attempt function for automatic grading
CREATE OR REPLACE FUNCTION public.auto_grade_attempt(attempt_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_marks NUMERIC := 0;
  earned_marks NUMERIC := 0;
  question_record RECORD;
  answer_record RECORD;
  correct_count INTEGER := 0;
  total_questions INTEGER := 0;
BEGIN
  -- Get all questions for this attempt's assignment
  FOR question_record IN
    SELECT q.id, q.marks, q.correct_answers, q.kind
    FROM clp_questions q
    JOIN clp_attempts a ON q.assignment_id = a.assignment_id
    WHERE a.id = attempt_id_param
  LOOP
    total_questions := total_questions + 1;
    total_marks := total_marks + question_record.marks;
    
    -- Get the user's answer for this question
    SELECT response INTO answer_record
    FROM clp_answers
    WHERE attempt_id = attempt_id_param AND question_id = question_record.id;
    
    -- Auto-grade based on question type
    IF question_record.kind = 'mcq' THEN
      -- For MCQ, check if the selected option matches any correct answer
      IF answer_record.response IS NOT NULL THEN
        -- Extract selected option from response
        DECLARE
          selected_option TEXT;
          correct_answers_array JSONB;
        BEGIN
          selected_option := answer_record.response->>'selected_option';
          correct_answers_array := question_record.correct_answers;
          
          -- Check if selected option is in correct answers
          IF correct_answers_array ? selected_option THEN
            earned_marks := earned_marks + question_record.marks;
            correct_count := correct_count + 1;
            
            -- Update the answer as correct
            UPDATE clp_answers 
            SET is_correct = true, marks_awarded = question_record.marks
            WHERE attempt_id = attempt_id_param AND question_id = question_record.id;
          ELSE
            -- Update the answer as incorrect
            UPDATE clp_answers 
            SET is_correct = false, marks_awarded = 0
            WHERE attempt_id = attempt_id_param AND question_id = question_record.id;
          END IF;
        END;
      END IF;
    ELSIF question_record.kind = 'essay' THEN
      -- For essay questions, mark as pending review (no auto-grading)
      UPDATE clp_answers 
      SET is_correct = NULL, marks_awarded = 0
      WHERE attempt_id = attempt_id_param AND question_id = question_record.id;
    END IF;
  END LOOP;
  
  -- Update the attempt with calculated scores
  UPDATE clp_attempts
  SET 
    score_numeric = CASE WHEN total_marks > 0 THEN (earned_marks / total_marks * 100) ELSE 0 END,
    score_points = earned_marks::integer,
    updated_at = now()
  WHERE id = attempt_id_param;
  
  -- Log the grading result
  RAISE LOG 'Auto-graded attempt %: % correct out of % questions, score: %/%', 
    attempt_id_param, correct_count, total_questions, earned_marks, total_marks;
END;
$function$;

-- Create the missing update_leaderboard_for_attempt function
CREATE OR REPLACE FUNCTION public.update_leaderboard_for_attempt(attempt_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_id_var UUID;
  course_id_var UUID;
  points_earned INTEGER := 0;
BEGIN
  -- Get user and course info from the attempt
  SELECT ca.user_id, cs.course_id, ca.score_points
  INTO user_id_var, course_id_var, points_earned
  FROM clp_attempts ca
  JOIN clp_assignments cass ON ca.assignment_id = cass.id
  JOIN course_sections cs ON cass.section_id = cs.id
  WHERE ca.id = attempt_id_param;
  
  IF user_id_var IS NULL THEN
    RETURN;
  END IF;
  
  -- Update or insert leaderboard entry
  INSERT INTO clp_leaderboard (user_id, course_id, points_total, last_updated_at)
  VALUES (user_id_var, course_id_var, points_earned, now())
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    points_total = clp_leaderboard.points_total + points_earned,
    last_updated_at = now();
    
  RAISE LOG 'Updated leaderboard for user % in course % with % points', 
    user_id_var, course_id_var, points_earned;
END;
$function$;