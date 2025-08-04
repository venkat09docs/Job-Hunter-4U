-- Add Job Search History page to premium features
INSERT INTO public.premium_features (feature_key, feature_name, description, is_premium)
VALUES 
  ('job_search_history', 'Job Search History', 'Access to view historical job search results and apply filters', false)
ON CONFLICT (feature_key) DO NOTHING;