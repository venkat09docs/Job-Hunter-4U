-- Add institute_admin_assignments table to track which institute an institute_admin manages
CREATE TABLE public.institute_admin_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, institute_id)
);

-- Enable RLS
ALTER TABLE public.institute_admin_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for institute_admin_assignments
CREATE POLICY "Super admins can manage institute admin assignments"
ON public.institute_admin_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institute admins can view their assignments"
ON public.institute_admin_assignments
FOR SELECT
USING (auth.uid() = user_id);

-- Update institutes policies to allow institute admins to manage their institutes
DROP POLICY "Super admins can manage all institutes" ON public.institutes;
DROP POLICY "Institute admins can manage their institutes" ON public.institutes;
DROP POLICY "Users can view active institutes" ON public.institutes;

CREATE POLICY "Super admins can manage all institutes"
ON public.institutes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institute admins can manage their institutes"
ON public.institutes
FOR ALL
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.institute_admin_assignments iaa
    WHERE iaa.user_id = auth.uid() 
    AND iaa.institute_id = institutes.id 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Users can view active institutes"
ON public.institutes
FOR SELECT
USING (is_active = true);

-- Update batches policies to allow institute admins to manage batches in their institutes
DROP POLICY "Super admins can manage all batches" ON public.batches;
DROP POLICY "Institute admins can manage batches in their institutes" ON public.batches;
DROP POLICY "Users can view active batches" ON public.batches;

CREATE POLICY "Super admins can manage all batches"
ON public.batches
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institute admins can manage batches in their institutes"
ON public.batches
FOR ALL
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.institute_admin_assignments iaa
    WHERE iaa.user_id = auth.uid() 
    AND iaa.institute_id = batches.institute_id 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Users can view active batches"
ON public.batches
FOR SELECT
USING (is_active = true);

-- Update user_assignments policies to allow institute admins to manage assignments in their institutes
DROP POLICY "Super admins can manage all user assignments" ON public.user_assignments;
DROP POLICY "Institute admins can manage assignments in their institutes" ON public.user_assignments;
DROP POLICY "Users can view their own assignments" ON public.user_assignments;

CREATE POLICY "Super admins can manage all user assignments"
ON public.user_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institute admins can manage assignments in their institutes"
ON public.user_assignments
FOR ALL
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  (
    user_assignments.institute_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.institute_admin_assignments iaa
      WHERE iaa.user_id = auth.uid() 
      AND iaa.institute_id = user_assignments.institute_id 
      AND iaa.is_active = true
    )
  )
);

CREATE POLICY "Users can view their own assignments"
ON public.user_assignments
FOR SELECT
USING (auth.uid() = user_id);

-- Function to check if user is institute admin for a specific institute
CREATE OR REPLACE FUNCTION public.is_institute_admin_for(user_id_param UUID, institute_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.institute_admin_assignments iaa
    WHERE iaa.user_id = user_id_param 
    AND iaa.institute_id = institute_id_param 
    AND iaa.is_active = true
  ) AND has_role(user_id_param, 'institute_admin'::app_role);
$$;

-- Function to get institutes managed by an institute admin
CREATE OR REPLACE FUNCTION public.get_managed_institutes(user_id_param UUID)
RETURNS TABLE (
  institute_id UUID,
  institute_name TEXT,
  institute_code TEXT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    i.id as institute_id,
    i.name as institute_name,
    i.code as institute_code
  FROM public.institutes i
  INNER JOIN public.institute_admin_assignments iaa ON i.id = iaa.institute_id
  WHERE iaa.user_id = user_id_param 
    AND iaa.is_active = true
    AND i.is_active = true;
$$;