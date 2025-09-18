-- Create the missing update_checklist_item_progress RPC function
CREATE OR REPLACE FUNCTION public.update_checklist_item_progress(
  chapter_id_param uuid,
  checklist_item_id_param text,
  is_completed_param boolean,
  user_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update the checklist progress
  INSERT INTO public.user_checklist_progress (
    user_id,
    chapter_id,
    checklist_item_id,
    is_completed,
    completed_at
  ) VALUES (
    user_id_param,
    chapter_id_param,
    checklist_item_id_param,
    is_completed_param,
    CASE WHEN is_completed_param THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id, chapter_id, checklist_item_id)
  DO UPDATE SET
    is_completed = is_completed_param,
    completed_at = CASE WHEN is_completed_param THEN now() ELSE NULL END,
    updated_at = now();
END;
$$;