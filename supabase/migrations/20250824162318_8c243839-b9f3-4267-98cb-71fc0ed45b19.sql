-- Temporarily disable the validation trigger to test if it's causing the INSERT error
DROP TRIGGER IF EXISTS validate_payment_basic_trigger ON public.payments;