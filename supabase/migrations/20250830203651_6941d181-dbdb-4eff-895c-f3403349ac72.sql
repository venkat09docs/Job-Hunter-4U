-- Add verification fields to github_evidence table for per-evidence verification
ALTER TABLE public.github_evidence ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';
ALTER TABLE public.github_evidence ADD COLUMN IF NOT EXISTS verification_notes text;
ALTER TABLE public.github_evidence ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;
ALTER TABLE public.github_evidence ADD COLUMN IF NOT EXISTS verified_by uuid;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_github_evidence_verification_status ON public.github_evidence(verification_status);
CREATE INDEX IF NOT EXISTS idx_github_evidence_user_task_id ON public.github_evidence(user_task_id);