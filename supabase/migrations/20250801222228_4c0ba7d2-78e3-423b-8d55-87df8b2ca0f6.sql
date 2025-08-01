-- Create saved_resumes table
CREATE TABLE public.saved_resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  word_url TEXT,
  pdf_url TEXT,
  resume_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_resumes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved resumes" 
ON public.saved_resumes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved resumes" 
ON public.saved_resumes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved resumes" 
ON public.saved_resumes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved resumes" 
ON public.saved_resumes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_resumes_updated_at
BEFORE UPDATE ON public.saved_resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();