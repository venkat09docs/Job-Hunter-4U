import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface PayoutRequest {
  id: string;
  affiliate_user_id: string;
  requested_amount: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  processed_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export const usePayoutRequests = (affiliateUserId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (affiliateUserId) {
      fetchPayoutRequests();
    } else {
      setLoading(false);
    }
  }, [affiliateUserId]);

  const fetchPayoutRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('affiliate_user_id', affiliateUserId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayoutRequests(data as PayoutRequest[] || []);
    } catch (error: any) {
      console.error('Error fetching payout requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async (amount: number) => {
    if (!affiliateUserId) {
      toast({
        title: 'Error',
        description: 'Affiliate user ID not found',
        variant: 'destructive'
      });
      return;
    }

    setRequesting(true);
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          affiliate_user_id: affiliateUserId,
          requested_amount: amount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setPayoutRequests(prev => [data as PayoutRequest, ...prev]);
      toast({
        title: 'Success',
        description: 'Payout request submitted successfully! You will be notified once it\'s processed.',
      });
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit payout request',
        variant: 'destructive'
      });
    } finally {
      setRequesting(false);
    }
  };

  const canRequestPayout = (affiliateData: any) => {
    if (!affiliateData || !affiliateData.created_at) return false;
    
    const createdDate = new Date(affiliateData.created_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff >= 15 && affiliateData.total_earnings > 0;
  };

  return {
    payoutRequests,
    loading,
    requesting,
    requestPayout,
    canRequestPayout,
    refreshPayoutRequests: fetchPayoutRequests
  };
};