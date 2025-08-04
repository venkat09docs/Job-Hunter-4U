-- Create table for saved README files
CREATE TABLE public.saved_readme_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_readme_files ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own README files" 
ON public.saved_readme_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own README files" 
ON public.saved_readme_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own README files" 
ON public.saved_readme_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own README files" 
ON public.saved_readme_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_readme_files_updated_at
BEFORE UPDATE ON public.saved_readme_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();