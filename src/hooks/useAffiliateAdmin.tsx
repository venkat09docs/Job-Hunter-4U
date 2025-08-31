import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface AffiliateUserWithProfile {
  id: string;
  user_id: string;
  affiliate_code: string;
  is_eligible: boolean;
  total_earnings: number;
  total_referrals: number;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
    username?: string;
  };
}

export const useAffiliateAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [affiliateUsers, setAffiliateUsers] = useState<AffiliateUserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchAffiliateUsers();
  }, []);

  const fetchAffiliateUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching affiliate users...');
      const { data, error } = await supabase
        .from('affiliate_users')
        .select(`
          *,
          profiles(
            full_name,
            email,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched affiliate users:', data);
      setAffiliateUsers((data as AffiliateUserWithProfile[]) || []);
    } catch (error: any) {
      console.error('Error fetching affiliate users:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch affiliate users: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAffiliateEligibility = async (affiliateId: string, isEligible: boolean) => {
    setUpdating(affiliateId);
    try {
      const updateData: any = { 
        is_eligible: isEligible,
        updated_at: new Date().toISOString()
      };

      if (isEligible) {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      } else {
        updateData.approved_by = null;
        updateData.approved_at = null;
      }

      const { error } = await supabase
        .from('affiliate_users')
        .update(updateData)
        .eq('id', affiliateId);

      if (error) throw error;

      // Update local state
      setAffiliateUsers(prev => 
        prev.map(user => 
          user.id === affiliateId 
            ? { 
                ...user, 
                is_eligible: isEligible,
                approved_by: isEligible ? user?.id : undefined,
                approved_at: isEligible ? new Date().toISOString() : undefined
              }
            : user
        )
      );

      toast({
        title: 'Success',
        description: `Affiliate ${isEligible ? 'approved' : 'disabled'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating affiliate eligibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update affiliate eligibility',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  };

  return {
    affiliateUsers,
    loading,
    updating,
    updateAffiliateEligibility,
    refreshData: fetchAffiliateUsers
  };
};