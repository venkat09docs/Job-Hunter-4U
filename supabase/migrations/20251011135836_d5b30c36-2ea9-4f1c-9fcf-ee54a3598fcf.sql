-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_resume_analysis_usage(UUID);
DROP FUNCTION IF EXISTS public.increment_resume_analysis_count(UUID);

-- Function to get resume analysis usage status
CREATE OR REPLACE FUNCTION public.get_resume_analysis_usage(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_current_count INTEGER;
  v_remaining_credits INTEGER;
  v_can_analyze BOOLEAN;
  v_limit_reached BOOLEAN;
  v_message TEXT;
BEGIN
  -- Check if user has active premium subscription
  SELECT subscription_active INTO v_is_premium
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  v_is_premium := COALESCE(v_is_premium, false);
  
  -- Get current analysis count
  SELECT analysis_count INTO v_current_count
  FROM public.resume_analysis_usage
  WHERE user_id = p_user_id;
  
  v_current_count := COALESCE(v_current_count, 0);
  
  -- Calculate remaining credits and status
  IF v_is_premium THEN
    v_remaining_credits := 999; -- Unlimited for premium users
    v_can_analyze := true;
    v_limit_reached := false;
    v_message := 'Unlimited analyses available with premium plan';
  ELSE
    -- Free users get 3 analyses
    v_remaining_credits := GREATEST(0, 3 - v_current_count);
    v_can_analyze := v_current_count < 3;
    v_limit_reached := v_current_count >= 3;
    
    IF v_limit_reached THEN
      v_message := 'Free limit reached. Upgrade to premium for unlimited analyses.';
    ELSE
      v_message := v_remaining_credits || ' free analyses remaining';
    END IF;
  END IF;
  
  RETURN json_build_object(
    'is_premium', v_is_premium,
    'remaining_credits', v_remaining_credits,
    'can_analyze', v_can_analyze,
    'limit_reached', v_limit_reached,
    'message', v_message,
    'current_count', v_current_count
  );
END;
$$;

-- Function to increment resume analysis count
CREATE OR REPLACE FUNCTION public.increment_resume_analysis_count(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_current_count INTEGER;
  v_new_count INTEGER;
  v_remaining_credits INTEGER;
  v_limit_reached BOOLEAN;
  v_message TEXT;
BEGIN
  -- Check if user has active premium subscription
  SELECT subscription_active INTO v_is_premium
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  v_is_premium := COALESCE(v_is_premium, false);
  
  -- Get current count
  SELECT analysis_count INTO v_current_count
  FROM public.resume_analysis_usage
  WHERE user_id = p_user_id;
  
  v_current_count := COALESCE(v_current_count, 0);
  
  -- Check if user can analyze (free users limited to 3)
  IF NOT v_is_premium AND v_current_count >= 3 THEN
    RETURN json_build_object(
      'success', false,
      'is_premium', v_is_premium,
      'remaining_credits', 0,
      'limit_reached', true,
      'message', 'Free limit reached. Please upgrade to premium for unlimited analyses.',
      'current_count', v_current_count
    );
  END IF;
  
  -- Insert or update usage count
  INSERT INTO public.resume_analysis_usage (user_id, analysis_count, updated_at)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    analysis_count = resume_analysis_usage.analysis_count + 1,
    updated_at = NOW()
  RETURNING analysis_count INTO v_new_count;
  
  -- Calculate remaining credits
  IF v_is_premium THEN
    v_remaining_credits := 999;
    v_limit_reached := false;
    v_message := 'Analysis completed. Unlimited analyses available.';
  ELSE
    v_remaining_credits := GREATEST(0, 3 - v_new_count);
    v_limit_reached := v_new_count >= 3;
    
    IF v_limit_reached THEN
      v_message := 'This was your last free analysis. Upgrade to premium for unlimited analyses.';
    ELSE
      v_message := 'Analysis completed. ' || v_remaining_credits || ' free analyses remaining.';
    END IF;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'is_premium', v_is_premium,
    'remaining_credits', v_remaining_credits,
    'limit_reached', v_limit_reached,
    'message', v_message,
    'current_count', v_new_count
  );
END;
$$;