-- Create table to track resume analysis usage
CREATE TABLE IF NOT EXISTS public.resume_analysis_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_count integer NOT NULL DEFAULT 0,
  last_analysis_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.resume_analysis_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own usage"
ON public.resume_analysis_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage record
CREATE POLICY "Users can insert their own usage"
ON public.resume_analysis_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update their own usage"
ON public.resume_analysis_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to increment analysis count
CREATE OR REPLACE FUNCTION public.increment_resume_analysis_count(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
  v_is_premium boolean;
BEGIN
  -- Check if user has active subscription
  SELECT subscription_active INTO v_is_premium
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- If premium, allow unlimited access
  IF v_is_premium THEN
    -- Update last analysis time but don't count
    INSERT INTO public.resume_analysis_usage (user_id, analysis_count, last_analysis_at)
    VALUES (p_user_id, 0, now())
    ON CONFLICT (user_id) DO UPDATE
    SET last_analysis_at = now(),
        updated_at = now();
    
    RETURN jsonb_build_object(
      'success', true,
      'is_premium', true,
      'remaining_credits', -1,
      'message', 'Unlimited access with premium subscription'
    );
  END IF;

  -- For free users, check and increment count
  INSERT INTO public.resume_analysis_usage (user_id, analysis_count, last_analysis_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE
  SET analysis_count = resume_analysis_usage.analysis_count + 1,
      last_analysis_at = now(),
      updated_at = now()
  RETURNING analysis_count INTO v_current_count;

  -- Return result with remaining credits
  RETURN jsonb_build_object(
    'success', true,
    'is_premium', false,
    'current_count', v_current_count,
    'remaining_credits', GREATEST(0, 3 - v_current_count),
    'limit_reached', v_current_count > 3,
    'message', CASE 
      WHEN v_current_count > 3 THEN 'Free analysis limit reached. Please upgrade to continue.'
      WHEN v_current_count = 3 THEN 'This was your last free analysis. Upgrade for unlimited access.'
      ELSE format('You have %s free analysis remaining.', 3 - v_current_count)
    END
  );
END;
$$;

-- Create function to get user's analysis usage
CREATE OR REPLACE FUNCTION public.get_resume_analysis_usage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage_count integer;
  v_is_premium boolean;
BEGIN
  -- Check if user has active subscription
  SELECT subscription_active INTO v_is_premium
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- If premium, return unlimited
  IF v_is_premium THEN
    RETURN jsonb_build_object(
      'is_premium', true,
      'remaining_credits', -1,
      'can_analyze', true,
      'message', 'Unlimited access with premium subscription'
    );
  END IF;

  -- Get current usage count for free users
  SELECT COALESCE(analysis_count, 0) INTO v_usage_count
  FROM public.resume_analysis_usage
  WHERE user_id = p_user_id;

  -- Return usage info
  RETURN jsonb_build_object(
    'is_premium', false,
    'current_count', v_usage_count,
    'remaining_credits', GREATEST(0, 3 - v_usage_count),
    'can_analyze', v_usage_count < 3,
    'limit_reached', v_usage_count >= 3,
    'message', CASE 
      WHEN v_usage_count >= 3 THEN 'Free analysis limit reached. Please upgrade to continue.'
      WHEN v_usage_count = 2 THEN 'You have 1 free analysis remaining.'
      ELSE format('You have %s free analyses remaining.', 3 - v_usage_count)
    END
  );
END;
$$;