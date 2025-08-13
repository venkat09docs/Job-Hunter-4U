-- Add missing premium features
INSERT INTO premium_features (feature_key, feature_name, description, is_premium) VALUES
('super_ai', 'Super AI', 'Access to advanced AI assistant capabilities', true),
('digital_portfolio', 'Digital Portfolio', 'Access to digital portfolio builder and management', true)
ON CONFLICT (feature_key) DO NOTHING;