-- Fix AI Tools Security: Restrict public access to embed codes
-- Remove the overly permissive policy that allows everyone to view active tools
DROP POLICY IF EXISTS "Everyone can view active tools" ON public.ai_tools;

-- Create a secure policy that requires authentication to view AI tools
CREATE POLICY "Authenticated users can view active tools" 
ON public.ai_tools 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true
);

-- Also update the ai_tool_categories table for consistency
DROP POLICY IF EXISTS "Everyone can view active categories" ON public.ai_tool_categories;

CREATE POLICY "Authenticated users can view active categories" 
ON public.ai_tool_categories 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true
);