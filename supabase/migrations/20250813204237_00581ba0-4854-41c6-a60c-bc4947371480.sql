-- Remove specific page access features from premium_features table
DELETE FROM public.premium_features 
WHERE feature_key IN ('page_blog_dashboard', 'page_digital_career_hub', 'page_linkedin_automation');