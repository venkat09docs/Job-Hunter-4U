-- Create categories table for AI tools
CREATE TABLE public.ai_tool_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS on categories table
ALTER TABLE public.ai_tool_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Everyone can view active categories" 
ON public.ai_tool_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all categories" 
ON public.ai_tool_categories 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert categories" 
ON public.ai_tool_categories 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND (auth.uid() = created_by));

CREATE POLICY "Admins can update categories" 
ON public.ai_tool_categories 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories" 
ON public.ai_tool_categories 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add category_id to ai_tools table
ALTER TABLE public.ai_tools 
ADD COLUMN category_id UUID REFERENCES public.ai_tool_categories(id);

-- Create index for performance
CREATE INDEX idx_ai_tools_category_id ON public.ai_tools(category_id);

-- Create trigger for category timestamps
CREATE TRIGGER update_ai_tool_categories_updated_at
BEFORE UPDATE ON public.ai_tool_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();