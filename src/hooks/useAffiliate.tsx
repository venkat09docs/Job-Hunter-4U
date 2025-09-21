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
      
      // Get user info using the database function that handles both profiles and auth.users
      if (data && data.length > 0) {
        const userIds = data.map(r => r.referred_user_id);
        
        const { data: userInfo, error: userError } = await supabase
          .rpc('get_affiliate_referral_users', { user_ids: userIds });
        
        if (userError) {
          console.error('Error fetching user info:', userError);
        }
        
        // Map user info to referrals
        const referralsWithUsers = data.map(referral => {
          const userProfile = userInfo?.find(u => u.user_id === referral.referred_user_id);
          
          return {
            ...referral,
            referred_user: userProfile ? {
              full_name: userProfile.full_name,
              username: userProfile.username,
              email: userProfile.email
            } : null
          };
        });
        
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

    // Check if user has active subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_active, subscription_end_date')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      toast({
        title: 'Error',
        description: 'Unable to verify subscription status',
        variant: 'destructive'
      });
      return;
    }

    // Validate active subscription
    const hasActiveSubscription = profile?.subscription_active && 
      profile?.subscription_end_date && 
      new Date(profile.subscription_end_date) > new Date();

    if (!hasActiveSubscription) {
      toast({
        title: 'Subscription Required',
        description: 'You need an active subscription to join the affiliate program',
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
        title: 'Request Submitted',
        description: 'Your affiliate program request has been submitted for admin approval.',
      });
    } catch (error: any) {
      console.error('Error creating affiliate account:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit affiliate request',
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