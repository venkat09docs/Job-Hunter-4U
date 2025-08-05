-- Drop and recreate the trigger to ensure it's working properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger with proper configuration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_with_webhook();

-- Also check if we can see any existing triggers
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  c.relname as table_name,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'users' AND n.nspname = 'auth' AND t.tgname = 'on_auth_user_created';