-- Create institutes table
CREATE TABLE public.institutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL, -- Unique institute code
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL, -- Batch code within institute
  institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institute_id, code) -- Unique batch code within institute
);

-- Create user assignments table
CREATE TABLE public.user_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('individual', 'batch', 'institute')),
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, institute_id, batch_id) -- Prevent duplicate assignments
);

-- Enable RLS
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for institutes
CREATE POLICY "Admins can manage institutes"
ON public.institutes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active institutes"
ON public.institutes
FOR SELECT
USING (is_active = true);

-- RLS Policies for batches
CREATE POLICY "Admins can manage batches"
ON public.batches
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active batches"
ON public.batches
FOR SELECT
USING (is_active = true);

-- RLS Policies for user assignments
CREATE POLICY "Admins can manage user assignments"
ON public.user_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own assignments"
ON public.user_assignments
FOR SELECT
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_institutes_updated_at
BEFORE UPDATE ON public.institutes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_batches_institute_id ON public.batches(institute_id);
CREATE INDEX idx_user_assignments_user_id ON public.user_assignments(user_id);
CREATE INDEX idx_user_assignments_institute_id ON public.user_assignments(institute_id);
CREATE INDEX idx_user_assignments_batch_id ON public.user_assignments(batch_id);

-- Function to get user's institute and batch info
CREATE OR REPLACE FUNCTION public.get_user_assignments(user_id_param UUID)
RETURNS TABLE (
  institute_id UUID,
  institute_name TEXT,
  institute_code TEXT,
  batch_id UUID,
  batch_name TEXT,
  batch_code TEXT,
  assignment_type TEXT
) 
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    ua.institute_id,
    i.name as institute_name,
    i.code as institute_code,
    ua.batch_id,
    b.name as batch_name,
    b.code as batch_code,
    ua.assignment_type
  FROM public.user_assignments ua
  LEFT JOIN public.institutes i ON ua.institute_id = i.id
  LEFT JOIN public.batches b ON ua.batch_id = b.id
  WHERE ua.user_id = user_id_param 
    AND ua.is_active = true
    AND (i.is_active = true OR i.is_active IS NULL)
    AND (b.is_active = true OR b.is_active IS NULL);
$$;