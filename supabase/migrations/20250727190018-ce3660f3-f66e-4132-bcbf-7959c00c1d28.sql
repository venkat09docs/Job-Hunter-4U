-- Create table for tool-specific chat conversations
CREATE TABLE public.tool_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tool_chats ENABLE ROW LEVEL SECURITY;

-- Create policies for user-specific access
CREATE POLICY "Users can view their own tool chats" 
ON public.tool_chats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tool chats" 
ON public.tool_chats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool chats" 
ON public.tool_chats 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tool chats" 
ON public.tool_chats 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tool_chats_updated_at
BEFORE UPDATE ON public.tool_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();