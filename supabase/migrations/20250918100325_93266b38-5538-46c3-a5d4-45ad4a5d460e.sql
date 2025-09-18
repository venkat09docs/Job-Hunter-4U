-- Complete database schema for checklist content type feature

-- First, ensure course_chapters table can store checklist data
-- (Assuming course_chapters table already exists with content column as jsonb)
-- If not, here's the basic structure:
-- CREATE TABLE IF NOT EXISTS public.course_chapters (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   section_id UUID NOT NULL,
--   title TEXT NOT NULL,
--   content_type TEXT NOT NULL DEFAULT 'article',
--   content JSONB NOT NULL DEFAULT '{}',
--   order_index INTEGER NOT NULL DEFAULT 0,
--   is_active BOOLEAN NOT NULL DEFAULT true,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
-- );

-- Table to track individual checklist item completion by users
CREATE TABLE IF NOT EXISTS public.user_checklist_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chapter_id UUID NOT NULL,
  checklist_item_id TEXT NOT NULL, -- This will be the index or unique identifier of the checklist item
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per user per checklist item
  UNIQUE(user_id, chapter_id, checklist_item_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_checklist_progress_user_id ON public.user_checklist_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_progress_chapter_id ON public.user_checklist_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_user_checklist_progress_completed ON public.user_checklist_progress(is_completed);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_checklist_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_checklist_progress_updated_at
  BEFORE UPDATE ON public.user_checklist_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_checklist_progress_updated_at();

-- RLS Policies
ALTER TABLE public.user_checklist_progress ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own checklist progress
CREATE POLICY "Users can manage their own checklist progress"
  ON public.user_checklist_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Super admins and recruiters can view all checklist progress
CREATE POLICY "Admins can view all checklist progress"
  ON public.user_checklist_progress
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'recruiter'::app_role)
  );

-- Function to get checklist progress for a chapter
CREATE OR REPLACE FUNCTION public.get_user_checklist_progress(chapter_id_param UUID, user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE(checklist_item_id TEXT, is_completed BOOLEAN, completed_at TIMESTAMP WITH TIME ZONE)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ucp.checklist_item_id,
    ucp.is_completed,
    ucp.completed_at
  FROM public.user_checklist_progress ucp
  WHERE ucp.chapter_id = chapter_id_param 
    AND ucp.user_id = user_id_param;
$$;

-- Function to mark checklist item as complete/incomplete
CREATE OR REPLACE FUNCTION public.update_checklist_item_progress(
  chapter_id_param UUID,
  checklist_item_id_param TEXT,
  is_completed_param BOOLEAN,
  user_id_param UUID DEFAULT auth.uid()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_checklist_progress (
    user_id,
    chapter_id,
    checklist_item_id,
    is_completed,
    completed_at
  ) VALUES (
    user_id_param,
    chapter_id_param,
    checklist_item_id_param,
    is_completed_param,
    CASE WHEN is_completed_param THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id, chapter_id, checklist_item_id)
  DO UPDATE SET
    is_completed = is_completed_param,
    completed_at = CASE WHEN is_completed_param THEN now() ELSE NULL END,
    updated_at = now();
END;
$$;