-- Create the missing get_checklist_progress RPC function
CREATE OR REPLACE FUNCTION public.get_checklist_progress(
  chapter_id_param uuid,
  user_id_param uuid
)
RETURNS TABLE(
  id uuid,
  chapter_id uuid,
  checklist_item_id text,
  is_completed boolean,
  completed_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ucp.id,
    ucp.chapter_id,
    ucp.checklist_item_id,
    ucp.is_completed,
    ucp.completed_at,
    ucp.created_at,
    ucp.updated_at
  FROM public.user_checklist_progress ucp
  WHERE ucp.chapter_id = chapter_id_param 
    AND ucp.user_id = user_id_param;
$$;