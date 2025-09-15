-- Add is_free and subscription_plan_id columns to clp_courses table
ALTER TABLE public.clp_courses 
ADD COLUMN is_free boolean NOT NULL DEFAULT false,
ADD COLUMN subscription_plan_id uuid REFERENCES public.subscription_plans(id);