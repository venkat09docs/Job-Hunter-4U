-- Test if we can see the log output level
SHOW log_min_messages;

-- Also check if the trigger is actually enabled
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  c.relname as table_name,
  n.nspname as schema_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'users' AND n.nspname = 'auth' AND t.tgname = 'on_auth_user_created';

-- Test a simple NOTICE to see if logging works at all
DO $$
BEGIN
  RAISE NOTICE 'Testing NOTICE logging - this should show up in logs';
  RAISE WARNING 'Testing WARNING logging - this should also show up';
END $$;