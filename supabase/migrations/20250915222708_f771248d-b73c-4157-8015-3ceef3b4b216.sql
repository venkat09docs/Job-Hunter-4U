-- Create a trigger function to call auto-assignment when chapters are completed
CREATE OR REPLACE FUNCTION trigger_auto_assignment() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  response_status INTEGER;
  response_body TEXT;
BEGIN
  -- Call the auto-assign-section-assignments function via HTTP
  SELECT 
    (response).status,
    (response).content
  INTO response_status, response_body
  FROM http((
    'POST',
    'https://moirryvajzyriagqihbe.supabase.co/functions/v1/auto-assign-section-assignments',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.jwt_secret', true)),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    json_build_object(
      'user_id', NEW.user_id::text,
      'chapter_id', NEW.chapter_id::text
    )::text
  )) AS response;
  
  -- Log the response for debugging
  RAISE LOG 'Auto-assignment response: Status=%, Body=%', response_status, response_body;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the chapter completion if auto-assignment fails
    RAISE WARNING 'Auto-assignment failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on user_chapter_completions table
DROP TRIGGER IF EXISTS trigger_auto_assign_on_chapter_completion ON user_chapter_completions;

CREATE TRIGGER trigger_auto_assign_on_chapter_completion
  AFTER INSERT ON user_chapter_completions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_assignment();