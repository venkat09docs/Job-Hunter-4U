-- Remove specific page access features from premium_features table
DELETE FROM public.premium_features 
WHERE feature_key IN ('blog_dashboard', 'digital_career_hub', 'linkedin_automation');