-- Create trigger specifically on auth.users with explicit schema reference
DO $$
BEGIN
  -- Drop trigger if it exists
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Create the trigger on auth.users
  EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()';
  
  RAISE NOTICE 'Trigger created successfully on auth.users';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating trigger: %', SQLERRM;
END $$;