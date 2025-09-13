-- Create trigger to automatically assign new users to RNS Tech Institute and IT batch
CREATE TRIGGER trigger_assign_new_users_to_rns_tech
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_new_users_to_rns_tech();