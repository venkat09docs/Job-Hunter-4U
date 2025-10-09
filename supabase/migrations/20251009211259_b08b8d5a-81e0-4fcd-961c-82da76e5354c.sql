-- Ensure portfolios table has proper RLS policies for service role operations
ALTER TABLE IF EXISTS public.portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only manage their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can view their own portfolios" ON public.portfolios;

-- Create comprehensive policies that allow service role operations
CREATE POLICY "Service role can manage all portfolios"
ON public.portfolios
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage their own portfolios"
ON public.portfolios
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure public_profiles table has proper RLS policies
ALTER TABLE IF EXISTS public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can manage their own public profiles" ON public.public_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.public_profiles;

-- Create comprehensive policies
CREATE POLICY "Service role can manage all public profiles"
ON public.public_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage their own public profiles"
ON public.public_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by everyone"
ON public.public_profiles
FOR SELECT
TO public
USING (is_public = true);