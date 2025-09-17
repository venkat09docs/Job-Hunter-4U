-- Fix RLS policy for clp_assignments to ensure recruiters can create assignments
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.clp_assignments;

-- Create separate policies for better control
CREATE POLICY "Admins and recruiters can view assignments" 
ON public.clp_assignments 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'institute_admin'::app_role) OR
  is_published = true
);

CREATE POLICY "Admins and recruiters can create assignments" 
ON public.clp_assignments 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'institute_admin'::app_role)
);

CREATE POLICY "Admins and recruiters can update assignments" 
ON public.clp_assignments 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'institute_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'institute_admin'::app_role)
);

CREATE POLICY "Admins and recruiters can delete assignments" 
ON public.clp_assignments 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'institute_admin'::app_role)
);