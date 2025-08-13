-- Remove specific features from the Other Features tab
DELETE FROM public.premium_features 
WHERE feature_key IN ('profile', 'linkedin-automation', 'blog');