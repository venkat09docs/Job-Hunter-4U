import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface AffiliateUser {
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
}

interface AffiliateReferral {
  id: string;
  affiliate_user_id: string;
  referred_user_id: string;
  subscription_amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_id?: string;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
  referred_user?: {
    full_name?: string;
    username?: string;
    email?: string;
  };
}

export const useAffiliate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [affiliateData, setAffiliateData] = useState<AffiliateUser | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAffiliateData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch referrals when affiliateData is available
  useEffect(() => {
    if (affiliateData?.id) {
      fetchReferrals();
    }
  }, [affiliateData]);

  const fetchAffiliateData = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_users')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setAffiliateData(data);
    } catch (error: any) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    if (!affiliateData?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_user_id', affiliateData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch referred user profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(r => r.referred_user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, email')
          .in('user_id', userIds);
        
        // Map profiles to referrals
        const referralsWithUsers = data.map(referral => ({
          ...referral,
          referred_user: profiles?.find(p => p.user_id === referral.referred_user_id)
        }));
        
        setReferrals(referralsWithUsers as AffiliateReferral[]);
      } else {
        setReferrals([]);
      }
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
    }
  };

  const createAffiliateAccount = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'User email not found',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      // Generate affiliate code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_affiliate_code', { user_email: user.email });

      if (codeError) throw codeError;

      // Create affiliate user record
      const { data, error } = await supabase
        .from('affiliate_users')
        .insert({
          user_id: user.id,
          affiliate_code: codeData,
          is_eligible: false // Requires admin approval
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliateData(data);
      toast({
        title: 'Success',
        description: 'Affiliate account created! Waiting for admin approval.',
      });
    } catch (error: any) {
      console.error('Error creating affiliate account:', error);
      toast({
        title: 'Error',
        description: 'Failed to create affiliate account',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const getAffiliateLink = () => {
    if (!affiliateData?.affiliate_code) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth?ref=${affiliateData.affiliate_code}`;
  };

  const copyAffiliateLink = async () => {
    const link = getAffiliateLink();
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Success',
        description: 'Affiliate link copied to clipboard!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive'
      });
    }
  };

  const recalculateAffiliateData = async () => {
    try {
      const { error } = await supabase.rpc('recalculate_affiliate_totals');
      if (error) throw error;
      
      // Refresh the data
      fetchAffiliateData();
      fetchReferrals();
      
      toast({
        title: 'Success',
        description: 'Affiliate earnings recalculated successfully!',
      });
    } catch (error: any) {
      console.error('Error recalculating affiliate data:', error);
      toast({
        title: 'Error',
        description: 'Failed to recalculate affiliate data',
        variant: 'destructive'
      });
    }
  };

  return {
    affiliateData,
    referrals,
    loading,
    creating,
    createAffiliateAccount,
    getAffiliateLink,
    copyAffiliateLink,
    recalculateAffiliateData,
    refreshData: fetchAffiliateData,
    refreshReferrals: fetchReferrals
  };
};