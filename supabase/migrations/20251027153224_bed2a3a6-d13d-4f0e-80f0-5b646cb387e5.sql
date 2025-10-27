-- Insert three new subscription plans for AI Career Offers
INSERT INTO subscription_plans (
  name,
  price_paisa,
  original_price_paisa,
  duration_days,
  features,
  is_active,
  description,
  discount_per_member,
  member_limit,
  is_popular
) VALUES
(
  'One Year Plan without Digital Profile',
  499900,
  499900,
  365,
  '["Full access to all courses", "Lifetime course updates", "Certificate of completion", "Community access"]'::jsonb,
  true,
  'One year access to all AI Career Level Up courses',
  0,
  1,
  false
),
(
  'One Year Plan with Digital Profile',
  799900,
  799900,
  365,
  '["Full access to all courses", "Digital Profile", "Bio Links", "Job Automation", "Lifetime course updates", "Certificate of completion", "Community access", "Priority support"]'::jsonb,
  true,
  'One year access with Digital Profile, Bio Links and Job Automation',
  0,
  1,
  true
),
(
  'Quick 10 Days Access',
  29900,
  29900,
  10,
  '["10 days full access", "Explore all courses", "Try before committing"]'::jsonb,
  true,
  'Quick 10 days access to explore all courses',
  0,
  1,
  false
);