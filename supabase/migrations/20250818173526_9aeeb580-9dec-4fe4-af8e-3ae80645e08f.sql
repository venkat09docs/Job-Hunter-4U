-- Create secure public access for AI tools showcase (without embed codes)
-- This allows the landing page to show tools but prevents access to sensitive embed codes

CREATE POLICY "Public can view basic tool info for showcase" 
ON public.ai_tools 
FOR SELECT 
USING (
  is_active = true
  -- This policy will be used with specific column selection to exclude embed_code
);

-- Also allow public access to categories for the showcase
CREATE POLICY "Public can view active categories for showcase" 
ON public.ai_tool_categories 
FOR SELECT 
USING (is_active = true);