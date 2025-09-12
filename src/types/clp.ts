// Career Level Program (CLP) Type Definitions

export type AssignmentType = 'mcq' | 'tf' | 'descriptive' | 'task';
export type AttemptPolicy = 'best' | 'last';
export type AttemptStatus = 'started' | 'submitted' | 'auto_submitted' | 'invalidated';
export type ReviewStatus = 'pending' | 'in_review' | 'published';
export type QuestionKind = 'mcq' | 'tf' | 'descriptive' | 'task';
export type VisibilityAudience = 'all' | 'cohort' | 'users';

export interface Course {
  id: string;
  title: string;
  code: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface Assignment {
  id: string;
  module_id: string;
  title: string;
  type: AssignmentType;
  instructions?: string;
  visible_from?: string;
  start_at?: string;
  end_at?: string;
  due_at?: string;
  duration_minutes?: number;
  randomize_questions: boolean;
  shuffle_options: boolean;
  negative_marking: boolean;
  max_attempts: number;
  attempt_policy: AttemptPolicy;
  points_scale: any;
  rubric: any;
  attachments_required: boolean;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  module?: Module;
  questions?: Question[];
  attempts?: Attempt[];
}

export interface Question {
  id: string;
  assignment_id: string;
  kind: QuestionKind;
  prompt: string;
  options: any;
  correct_answers: any;
  expected_answer?: string; // For descriptive questions - admin's expected answer
  instructions?: string; // For task/project questions - detailed instructions
  marks: number;
  order_index: number;
  metadata: any;
  created_at: string;
}

export interface Attempt {
  id: string;
  assignment_id: string;
  user_id: string;
  started_at: string;
  submitted_at?: string;
  time_used_seconds: number;
  status: AttemptStatus;
  score_numeric?: number;
  score_points: number;
  review_status: ReviewStatus;
  ip_address?: any;
  device_info?: string;
  audit: any;
  created_at: string;
  updated_at: string;
  assignment?: Assignment;
  answers?: Answer[];
  review?: Review;
}

export interface Answer {
  id: string;
  attempt_id: string;
  question_id: string;
  response: any;
  is_correct?: boolean;
  marks_awarded: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
  question?: Question;
}

export interface Review {
  id: string;
  attempt_id: string;
  reviewer_id: string;
  rubric_scores: any;
  reviewer_comments?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  course_id?: string;
  module_id?: string;
  points_total: number;
  last_updated_at: string;
  created_at: string;
  user?: {
    id: string;
    full_name?: string;
    username?: string;
    profile_image_url?: string;
  };
}

export interface AssignmentVisibility {
  id: string;
  assignment_id: string;
  audience: VisibilityAudience;
  cohort_id?: string;
  user_ids: string[];
  created_at: string;
}

export interface CLPNotification {
  id: string;
  user_id: string;
  assignment_id?: string;
  type: string;
  payload: Record<string, any>;
  sent_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  entity: string;
  entity_id: string;
  data: Record<string, any>;
  created_at: string;
}

// Form types for creating/editing
export interface CreateCourseData {
  title: string;
  code: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export interface CreateModuleData {
  course_id: string;
  title: string;
  description?: string;
  order_index?: number;
  is_active?: boolean;
}

export interface CreateAssignmentData {
  module_id: string;
  title: string;
  type: AssignmentType;
  instructions?: string;
  visible_from?: string;
  start_at?: string;
  end_at?: string;
  due_at?: string;
  duration_minutes?: number;
  randomize_questions?: boolean;
  shuffle_options?: boolean;
  negative_marking?: boolean;
  max_attempts?: number;
  attempt_policy?: AttemptPolicy;
  points_scale?: Record<string, any>;
  rubric?: Record<string, any>;
  attachments_required?: boolean;
  is_published?: boolean;
}

export interface CreateQuestionData {
  assignment_id: string;
  kind: 'mcq' | 'tf' | 'descriptive'; // Database only supports these three types
  prompt: string;
  options?: string[];
  correct_answers?: string[];
  marks?: number;
  order_index?: number;
  metadata?: Record<string, any>;
}

export interface SubmitAnswerData {
  attempt_id: string;
  question_id: string;
  response: Record<string, any>;
}

export interface CreateReviewData {
  attempt_id: string;
  rubric_scores?: Record<string, any>;
  reviewer_comments?: string;
}

// Assignment status enums for UI
export const ASSIGNMENT_STATUS_LABELS = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  open: 'Open',
  closed: 'Closed',
  grading: 'Grading',
  published: 'Published'
} as const;

export const ATTEMPT_STATUS_LABELS = {
  started: 'In Progress',
  submitted: 'Submitted',
  auto_submitted: 'Auto-Submitted',
  invalidated: 'Invalidated'
} as const;

export const REVIEW_STATUS_LABELS = {
  pending: 'Pending Review',
  in_review: 'Under Review',
  published: 'Reviewed'
} as const;

// Utility types
export type AssignmentStatus = keyof typeof ASSIGNMENT_STATUS_LABELS;

export interface AttemptTimer {
  timeRemaining: number;
  isExpired: boolean;
  formatTime: (seconds: number) => string;
}

export interface QuestionWithAnswer extends Question {
  userAnswer?: Answer;
}

export interface AssignmentWithProgress extends Assignment {
  userAttempts: Attempt[];
  canAttempt: boolean;
  attemptsRemaining: number;
  status: AssignmentStatus;
}