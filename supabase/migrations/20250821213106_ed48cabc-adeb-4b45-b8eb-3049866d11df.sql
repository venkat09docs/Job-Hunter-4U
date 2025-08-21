-- Create sub_categories table
CREATE TABLE public.sub_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_sub_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sub_categories_updated_at
  BEFORE UPDATE ON public.sub_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sub_categories_updated_at();

-- Enable RLS
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage sub categories" 
ON public.sub_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active sub categories" 
ON public.sub_categories 
FOR SELECT 
USING (is_active = true);

-- Add sub_category_id column to career_task_templates for proper linking
ALTER TABLE public.career_task_templates 
ADD COLUMN sub_category_id UUID REFERENCES public.sub_categories(id);

-- Enable realtime for sub_categories table
ALTER TABLE public.sub_categories REPLICA IDENTITY FULL;

-- Add table to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.sub_categories;