-- CRITICAL SECURITY FIX: Fix payments table security (Part 1 - Clean up existing triggers)

-- Drop existing triggers that might conflict
DROP TRIGGER IF EXISTS validate_payment_data_trigger ON public.payments;
DROP TRIGGER IF EXISTS audit_payment_access ON public.payments;
DROP TRIGGER IF EXISTS audit_payment_operations_trigger ON public.payments;

-- Drop existing functions that we're replacing
DROP FUNCTION IF EXISTS public.validate_payment_data_secure();
DROP FUNCTION IF EXISTS public.audit_payment_operations();

-- First, drop existing potentially problematic policies to start fresh
DROP POLICY IF EXISTS "Block all anonymous access to payments" ON public.payments;
DROP POLICY IF EXISTS "Users can only view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can only insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can only update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role has full payment access" ON public.payments;
DROP POLICY IF EXISTS "Block public role access to payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments only" ON public.payments;
DROP POLICY IF EXISTS "Users can create their own payments only" ON public.payments;
DROP POLICY IF EXISTS "Users can update limited payment fields only" ON public.payments;
DROP POLICY IF EXISTS "Block user deletion of payments" ON public.payments;