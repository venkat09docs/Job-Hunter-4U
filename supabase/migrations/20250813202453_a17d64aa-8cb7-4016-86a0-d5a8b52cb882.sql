-- Add premium features for Career Growth Activities and Career Growth Report
INSERT INTO premium_features (feature_key, feature_name, description, is_premium) VALUES
('career_growth_activities', 'Career Growth Activities', 'Access to detailed career growth activities and tracking dashboard', true),
('career_growth_report', 'Career Growth Report', 'Access to comprehensive career growth analytics and reporting', true)
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  description = EXCLUDED.description,
  is_premium = EXCLUDED.is_premium;