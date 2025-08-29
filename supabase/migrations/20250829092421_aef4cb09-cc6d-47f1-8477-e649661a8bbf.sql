-- Create user_inputs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Enable RLS
ALTER TABLE public.user_inputs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own inputs" ON public.user_inputs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inputs" ON public.user_inputs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inputs" ON public.user_inputs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inputs" ON public.user_inputs
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_user_inputs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_user_inputs_updated_at ON public.user_inputs;
CREATE TRIGGER update_user_inputs_updated_at
  BEFORE UPDATE ON public.user_inputs
  FOR EACH ROW EXECUTE FUNCTION public.update_user_inputs_updated_at();