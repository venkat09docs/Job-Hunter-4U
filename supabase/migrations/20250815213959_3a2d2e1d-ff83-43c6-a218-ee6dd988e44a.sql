-- Add sample activity points for institute students to make leaderboard functional

-- Add points for gopi (DevOps batch student)
INSERT INTO user_activity_points (user_id, activity_type, activity_id, points_earned, activity_date) VALUES 
('9f102b49-e761-4df6-addd-ea1863fa24d6', 'profile_building', 'profile_completion_35', 15, '2025-08-15'),
('9f102b49-e761-4df6-addd-ea1863fa24d6', 'linkedin_activity', 'linkedin_profile_setup', 20, '2025-08-14'),
('9f102b49-e761-4df6-addd-ea1863fa24d6', 'github_activity', 'github_profile_optimization', 25, '2025-08-13'),
('9f102b49-e761-4df6-addd-ea1863fa24d6', 'skill_development', 'completed_learning_goal', 30, '2025-08-12'),
('9f102b49-e761-4df6-addd-ea1863fa24d6', 'networking', 'linkedin_connection_milestone', 10, '2025-08-11');

-- Add points for sushma (AWS batch student)  
INSERT INTO user_activity_points (user_id, activity_type, activity_id, points_earned, activity_date) VALUES 
('4bf2ead2-7d44-433e-b46b-36c5dd064746', 'profile_building', 'profile_completion_19', 10, '2025-08-15'),
('4bf2ead2-7d44-433e-b46b-36c5dd064746', 'linkedin_activity', 'linkedin_profile_optimization', 18, '2025-08-14'),
('4bf2ead2-7d44-433e-b46b-36c5dd064746', 'github_activity', 'github_repository_creation', 15, '2025-08-13'),
('4bf2ead2-7d44-433e-b46b-36c5dd064746', 'skill_development', 'aws_certification_prep', 35, '2025-08-12'),
('4bf2ead2-7d44-433e-b46b-36c5dd064746', 'networking', 'professional_network_growth', 12, '2025-08-10');