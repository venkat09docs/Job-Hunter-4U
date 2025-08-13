-- Remove specified features from premium_features table
DELETE FROM premium_features 
WHERE feature_key IN (
  'edit_bio_tree',
  'linkedin_automation', 
  'blog_dashboard',
  'digital_career_hub'
);