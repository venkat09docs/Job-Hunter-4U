-- Create table to track user's last viewed chapter per course
CREATE TABLE public.user_last_viewed_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  chapter_id UUID NOT NULL,
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.user_last_viewed_chapters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own last viewed chapters" 
ON public.user_last_viewed_chapters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own last viewed chapters" 
ON public.user_last_viewed_chapters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own last viewed chapters" 
ON public.user_last_viewed_chapters 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_last_viewed_chapters_updated_at
BEFORE UPDATE ON public.user_last_viewed_chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_user_chapter_completions_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_user_last_viewed_chapters_user_course 
ON public.user_last_viewed_chapters(user_id, course_id);