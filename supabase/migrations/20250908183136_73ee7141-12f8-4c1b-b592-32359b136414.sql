-- Career Level Program (CLP) Database Schema
-- All tables use clp_ prefix to avoid conflicts with existing system

-- Courses table
CREATE TABLE public.clp_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modules table
CREATE TABLE public.clp_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.clp_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assignment types enum
CREATE TYPE assignment_type AS ENUM ('mcq', 'tf', 'descriptive', 'task');
CREATE TYPE attempt_policy AS ENUM ('best', 'last');
CREATE TYPE attempt_status AS ENUM ('started', 'submitted', 'auto_submitted', 'invalidated');
CREATE TYPE review_status AS ENUM ('pending', 'in_review', 'published');
CREATE TYPE question_kind AS ENUM ('mcq', 'tf', 'descriptive');
CREATE TYPE visibility_audience AS ENUM ('all', 'cohort', 'users');

-- Assignments table
CREATE TABLE public.clp_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.clp_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type assignment_type NOT NULL,
  instructions TEXT,
  visible_from TIMESTAMPTZ,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  randomize_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  negative_marking BOOLEAN DEFAULT false,
  max_attempts INTEGER DEFAULT 1,
  attempt_policy attempt_policy DEFAULT 'best',
  points_scale JSONB DEFAULT '{}',
  rubric JSONB DEFAULT '{}',
  attachments_required BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE public.clp_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.clp_assignments(id) ON DELETE CASCADE,
  kind question_kind NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  correct_answers JSONB DEFAULT '[]',
  marks DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attempts table
CREATE TABLE public.clp_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.clp_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  time_used_seconds INTEGER DEFAULT 0,
  status attempt_status NOT NULL DEFAULT 'started',
  score_numeric DECIMAL(5,2),
  score_points INTEGER DEFAULT 0,
  review_status review_status DEFAULT 'pending',
  ip_address INET,
  device_info TEXT,
  audit JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Answers table
CREATE TABLE public.clp_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.clp_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.clp_questions(id) ON DELETE CASCADE,
  response JSONB NOT NULL DEFAULT '{}',
  is_correct BOOLEAN,
  marks_awarded DECIMAL(5,2) DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews table
CREATE TABLE public.clp_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.clp_attempts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rubric_scores JSONB DEFAULT '{}',
  reviewer_comments TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leaderboard table
CREATE TABLE public.clp_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.clp_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.clp_modules(id) ON DELETE CASCADE,
  points_total INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, module_id)
);

-- Assignment visibility table
CREATE TABLE public.clp_assignments_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.clp_assignments(id) ON DELETE CASCADE,
  audience visibility_audience NOT NULL DEFAULT 'all',
  cohort_id UUID,
  user_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.clp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assignment_id UUID REFERENCES public.clp_assignments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log table
CREATE TABLE public.clp_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_clp_modules_course_id ON public.clp_modules(course_id);
CREATE INDEX idx_clp_assignments_module_id ON public.clp_assignments(module_id);
CREATE INDEX idx_clp_questions_assignment_id ON public.clp_questions(assignment_id);
CREATE INDEX idx_clp_attempts_assignment_id ON public.clp_attempts(assignment_id);
CREATE INDEX idx_clp_attempts_user_id ON public.clp_attempts(user_id);
CREATE INDEX idx_clp_answers_attempt_id ON public.clp_answers(attempt_id);
CREATE INDEX idx_clp_reviews_attempt_id ON public.clp_reviews(attempt_id);
CREATE INDEX idx_clp_leaderboard_user_id ON public.clp_leaderboard(user_id);
CREATE INDEX idx_clp_assignments_visibility_assignment_id ON public.clp_assignments_visibility(assignment_id);

-- RLS Policies
ALTER TABLE public.clp_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_assignments_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clp_audit_log ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Admins can manage courses" ON public.clp_courses
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'institute_admin'::app_role));

CREATE POLICY "Users can view active courses" ON public.clp_courses
  FOR SELECT USING (is_active = true);

-- Modules policies
CREATE POLICY "Admins can manage modules" ON public.clp_modules
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'institute_admin'::app_role));

CREATE POLICY "Users can view active modules" ON public.clp_modules
  FOR SELECT USING (is_active = true);

-- Assignments policies
CREATE POLICY "Admins can manage assignments" ON public.clp_assignments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'institute_admin'::app_role));

CREATE POLICY "Users can view published assignments" ON public.clp_assignments
  FOR SELECT USING (is_published = true AND (visible_from IS NULL OR visible_from <= now()));

-- Questions policies
CREATE POLICY "Admins can manage questions" ON public.clp_questions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'institute_admin'::app_role));

CREATE POLICY "Users can view questions during attempts" ON public.clp_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clp_attempts ca 
      WHERE ca.assignment_id = clp_questions.assignment_id 
      AND ca.user_id = auth.uid() 
      AND ca.status = 'started'
    )
  );

-- Attempts policies
CREATE POLICY "Users can manage their own attempts" ON public.clp_attempts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts" ON public.clp_attempts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'institute_admin'::app_role));

-- Answers policies
CREATE POLICY "Users can manage their own answers" ON public.clp_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clp_attempts ca 
      WHERE ca.id = clp_answers.attempt_id 
      AND ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all answers" ON public.clp_answers
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'institute_admin'::app_role));

-- Reviews policies
CREATE POLICY "Admins can manage reviews" ON public.clp_reviews
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'institute_admin'::app_role));

CREATE POLICY "Users can view their own published reviews" ON public.clp_reviews
  FOR SELECT USING (
    published_at IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.clp_attempts ca 
      WHERE ca.id = clp_reviews.attempt_id 
      AND ca.user_id = auth.uid()
    )
  );

-- Leaderboard policies
CREATE POLICY "Users can view leaderboard" ON public.clp_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "System can update leaderboard" ON public.clp_leaderboard
  FOR ALL USING (true);

-- Visibility policies
CREATE POLICY "Admins can manage visibility" ON public.clp_assignments_visibility
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role) OR has_role(auth.uid(), 'institute_admin'::app_role));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.clp_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.clp_notifications
  FOR INSERT WITH CHECK (true);

-- Audit log policies
CREATE POLICY "System can insert audit logs" ON public.clp_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view audit logs" ON public.clp_audit_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Functions for auto-grading and scoring
CREATE OR REPLACE FUNCTION auto_grade_attempt(attempt_id UUID)
RETURNS VOID AS $$
DECLARE
  question_record RECORD;
  answer_record RECORD;
  total_marks DECIMAL(5,2) := 0;
  earned_marks DECIMAL(5,2) := 0;
  assignment_negative_marking BOOLEAN;
BEGIN
  -- Get assignment settings
  SELECT negative_marking INTO assignment_negative_marking
  FROM clp_assignments ca
  JOIN clp_attempts cat ON ca.id = cat.assignment_id
  WHERE cat.id = attempt_id;

  -- Process each question for this attempt
  FOR question_record IN 
    SELECT cq.* FROM clp_questions cq
    JOIN clp_assignments ca ON cq.assignment_id = ca.id
    JOIN clp_attempts cat ON ca.id = cat.assignment_id
    WHERE cat.id = attempt_id
  LOOP
    total_marks := total_marks + question_record.marks;
    
    -- Find the answer for this question
    SELECT * INTO answer_record 
    FROM clp_answers 
    WHERE attempt_id = auto_grade_attempt.attempt_id 
    AND question_id = question_record.id;
    
    IF FOUND THEN
      -- Auto-grade MCQ and True/False questions
      IF question_record.kind IN ('mcq', 'tf') THEN
        IF answer_record.response::jsonb = question_record.correct_answers::jsonb THEN
          -- Correct answer
          UPDATE clp_answers 
          SET is_correct = true, marks_awarded = question_record.marks
          WHERE id = answer_record.id;
          earned_marks := earned_marks + question_record.marks;
        ELSE
          -- Incorrect answer
          UPDATE clp_answers 
          SET is_correct = false, marks_awarded = CASE 
            WHEN assignment_negative_marking THEN -question_record.marks * 0.25
            ELSE 0 
          END
          WHERE id = answer_record.id;
          
          IF assignment_negative_marking THEN
            earned_marks := earned_marks - (question_record.marks * 0.25);
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  -- Update attempt score
  UPDATE clp_attempts 
  SET score_numeric = CASE 
    WHEN total_marks > 0 THEN (earned_marks / total_marks) * 100
    ELSE 0 
  END,
  score_points = GREATEST(0, earned_marks::INTEGER)
  WHERE id = attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard_for_attempt(attempt_id UUID)
RETURNS VOID AS $$
DECLARE
  attempt_record RECORD;
  course_id UUID;
  module_id UUID;
BEGIN
  -- Get attempt details
  SELECT ca.user_id, ca.score_points, cm.id as mod_id, cc.id as crs_id
  INTO attempt_record
  FROM clp_attempts ca
  JOIN clp_assignments cas ON ca.assignment_id = cas.id
  JOIN clp_modules cm ON cas.module_id = cm.id
  JOIN clp_courses cc ON cm.course_id = cc.id
  WHERE ca.id = attempt_id;
  
  IF FOUND THEN
    course_id := attempt_record.crs_id;
    module_id := attempt_record.mod_id;
    
    -- Update module leaderboard
    INSERT INTO clp_leaderboard (user_id, course_id, module_id, points_total)
    VALUES (attempt_record.user_id, course_id, module_id, attempt_record.score_points)
    ON CONFLICT (user_id, course_id, module_id)
    DO UPDATE SET 
      points_total = clp_leaderboard.points_total + attempt_record.score_points,
      last_updated_at = now();
    
    -- Update course leaderboard
    INSERT INTO clp_leaderboard (user_id, course_id, module_id, points_total)
    VALUES (attempt_record.user_id, course_id, NULL, attempt_record.score_points)
    ON CONFLICT (user_id, course_id, module_id)
    DO UPDATE SET 
      points_total = clp_leaderboard.points_total + attempt_record.score_points,
      last_updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-submit when time expires
CREATE OR REPLACE FUNCTION trigger_auto_submit()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-grade if it's an objective assignment
  IF NEW.status IN ('submitted', 'auto_submitted') AND OLD.status = 'started' THEN
    PERFORM auto_grade_attempt(NEW.id);
    PERFORM update_leaderboard_for_attempt(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clp_attempts_auto_grade
  AFTER UPDATE ON clp_attempts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_submit();

-- Insert seed data with static UUIDs
INSERT INTO public.clp_courses (id, title, code, description, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Web Development Fundamentals', 'WEB101', 'Learn the basics of web development including HTML, CSS, and JavaScript', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', 'Advanced Programming Concepts', 'PROG201', 'Master advanced programming concepts and design patterns', '550e8400-e29b-41d4-a716-446655440000');

INSERT INTO public.clp_modules (id, course_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'HTML & CSS Basics', 'Introduction to HTML structure and CSS styling', 1),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'JavaScript Fundamentals', 'Learn JavaScript programming basics', 2),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Object-Oriented Programming', 'Understanding OOP principles and patterns', 1);

-- Sample MCQ Assignment
INSERT INTO public.clp_assignments (
  id, module_id, title, type, instructions, 
  visible_from, start_at, end_at, due_at, 
  duration_minutes, max_attempts, is_published, created_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440011',
  'HTML Basics Quiz',
  'mcq',
  'Test your knowledge of HTML fundamentals. You have 30 minutes to complete this quiz.',
  now(),
  now(),
  now() + INTERVAL '7 days',
  now() + INTERVAL '7 days',
  30,
  2,
  true,
  '550e8400-e29b-41d4-a716-446655440000'
);

-- Sample questions for MCQ assignment
INSERT INTO public.clp_questions (id, assignment_id, kind, prompt, options, correct_answers, marks, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 'mcq', 'Which HTML tag is used for the largest heading?', '["<h1>", "<h6>", "<head>", "<title>"]', '["<h1>"]', 2.0, 1),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440021', 'tf', 'HTML stands for HyperText Markup Language.', '["True", "False"]', '["True"]', 1.0, 2);

-- Sample Descriptive Assignment
INSERT INTO public.clp_assignments (
  id, module_id, title, type, instructions,
  visible_from, start_at, end_at, due_at,
  duration_minutes, rubric, is_published, created_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440022',
  '550e8400-e29b-41d4-a716-446655440012',
  'JavaScript Concepts Essay',
  'descriptive',
  'Write a detailed explanation of JavaScript closures and their practical applications. Minimum 500 words.',
  now(),
  now(),
  now() + INTERVAL '10 days', 
  now() + INTERVAL '10 days',
  60,
  '{"criteria": [{"name": "Understanding", "maxPoints": 5}, {"name": "Examples", "maxPoints": 3}, {"name": "Clarity", "maxPoints": 2}]}',
  true,
  '550e8400-e29b-41d4-a716-446655440000'
);

INSERT INTO public.clp_questions (id, assignment_id, kind, prompt, marks, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440022', 'descriptive', 'Explain JavaScript closures with practical examples and use cases.', 10.0, 1);