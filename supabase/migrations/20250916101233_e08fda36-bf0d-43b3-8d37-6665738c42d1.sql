-- Drop the existing function first
DROP FUNCTION IF EXISTS public.auto_grade_attempt(uuid);

-- Recreate the function with proper parameter naming to avoid ambiguity
CREATE OR REPLACE FUNCTION public.auto_grade_attempt(p_attempt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  question_record RECORD;
  answer_record RECORD;
  total_marks NUMERIC := 0;
  scored_marks NUMERIC := 0;
BEGIN
  -- Get all questions for this attempt's assignment
  FOR question_record IN
    SELECT q.*
    FROM clp_questions q
    JOIN clp_attempts a ON q.assignment_id = a.assignment_id
    WHERE a.id = p_attempt_id
    ORDER BY q.order_index
  LOOP
    -- Get the user's answer for this question
    SELECT * INTO answer_record
    FROM clp_answers 
    WHERE clp_answers.attempt_id = p_attempt_id 
    AND clp_answers.question_id = question_record.id;
    
    -- Add to total marks
    total_marks := total_marks + question_record.marks;
    
    -- If answer exists, check if it's correct and award marks
    IF answer_record.id IS NOT NULL THEN
      -- For MCQ and True/False questions, auto-grade based on correct_answers
      IF question_record.kind IN ('mcq', 'tf') THEN
        -- Compare user response with correct answers
        IF answer_record.response::jsonb = question_record.correct_answers::jsonb THEN
          UPDATE clp_answers 
          SET 
            is_correct = true,
            marks_awarded = question_record.marks,
            updated_at = now()
          WHERE id = answer_record.id;
          
          scored_marks := scored_marks + question_record.marks;
        ELSE
          UPDATE clp_answers 
          SET 
            is_correct = false,
            marks_awarded = 0,
            updated_at = now()
          WHERE id = answer_record.id;
        END IF;
      ELSE
        -- For descriptive questions, mark for manual review
        UPDATE clp_answers 
        SET 
          is_correct = null,
          marks_awarded = 0,
          updated_at = now()
        WHERE id = answer_record.id;
      END IF;
    END IF;
  END LOOP;
  
  -- Update the attempt with calculated scores
  UPDATE clp_attempts 
  SET 
    score_numeric = CASE 
      WHEN total_marks > 0 THEN (scored_marks / total_marks * 100)
      ELSE 0 
    END,
    score_points = scored_marks::integer,
    updated_at = now()
  WHERE id = p_attempt_id;
  
END;
$function$;