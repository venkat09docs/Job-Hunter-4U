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

interface PayoutRequestWithDetails {
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
  affiliate_users?: {
    affiliate_code: string;
    total_earnings: number;
    profiles?: {
      full_name?: string;
      email?: string;
      username?: string;
    };
  };
}

export const useAffiliateAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [affiliateUsers, setAffiliateUsers] = useState<AffiliateUserWithProfile[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.id) {
      fetchAffiliateUsers();
      fetchPayoutRequests();
    } else {
      setLoading(false);
    }
  }, [user, currentPage, searchQuery, statusFilter]);

  const fetchAffiliateUsers = async () => {
    try {
      setLoading(true);
      
      // Build query with pagination
      let query = supabase
        .from('affiliate_users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('is_eligible', statusFilter === 'active');
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Set total count and calculate pages
      setTotalUsers(count || 0);
      setTotalPages(Math.max(1, Math.ceil((count || 0) / itemsPerPage)));

      // Fetch profiles for these users
      if (data && data.length > 0) {
        const userIds = data.map(au => au.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, username')
          .in('user_id', userIds);

        // Map profiles to affiliate users
        let affiliateUsersWithProfiles = data.map(au => ({
          ...au,
          profiles: profiles?.find(p => p.user_id === au.user_id)
        })) as AffiliateUserWithProfile[];

        // Apply search filter on client side (after getting profiles)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          affiliateUsersWithProfiles = affiliateUsersWithProfiles.filter(user => {
            const fullName = user.profiles?.full_name?.toLowerCase() || '';
            const email = user.profiles?.email?.toLowerCase() || '';
            const username = user.profiles?.username?.toLowerCase() || '';
            const affiliateCode = user.affiliate_code?.toLowerCase() || '';
            
            return fullName.includes(query) || 
                   email.includes(query) || 
                   username.includes(query) || 
                   affiliateCode.includes(query);
          });
        }

        setAffiliateUsers(affiliateUsersWithProfiles);
      } else {
        setAffiliateUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching affiliate users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch affiliate users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutRequests = async () => {
    try {
      // Fetch payout requests
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related data
      if (data && data.length > 0) {
        const affiliateUserIds = data.map(pr => pr.affiliate_user_id);
        
        // Fetch affiliate users
        const { data: affiliateUsersData } = await supabase
          .from('affiliate_users')
          .select('id, affiliate_code, total_earnings, user_id')
          .in('id', affiliateUserIds);

        // Fetch profiles
        const userIds = affiliateUsersData?.map(au => au.user_id) || [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, username')
          .in('user_id', userIds);

        // Map the data together
        const payoutRequestsWithDetails = data.map(pr => ({
          ...pr,
          affiliate_users: {
            ...affiliateUsersData?.find(au => au.id === pr.affiliate_user_id),
            profiles: profiles?.find(p => p.user_id === affiliateUsersData?.find(au => au.id === pr.affiliate_user_id)?.user_id)
          }
        }));

        setPayoutRequests(payoutRequestsWithDetails as PayoutRequestWithDetails[]);
      } else {
        setPayoutRequests([]);
      }
    } catch (error: any) {
      console.error('Error fetching payout requests:', error);
    }
  };

  const updateAffiliateEligibility = async (affiliateId: string, isEligible: boolean) => {
    setUpdating(true);
    try {
      const updateData: any = {
        is_eligible: isEligible,
        updated_at: new Date().toISOString()
      };

      if (isEligible) {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('affiliate_users')
        .update(updateData)
        .eq('id', affiliateId);

      if (error) throw error;

      setAffiliateUsers(prev =>
        prev.map(affiliate =>
          affiliate.id === affiliateId
            ? { ...affiliate, ...updateData }
            : affiliate
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
      setUpdating(false);
    }
  };

  const updatePayoutRequest = async (
    payoutId: string, 
    status: 'approved' | 'rejected' | 'processing' | 'completed',
    notes?: string,
    rejectionReason?: string
  ) => {
    setUpdating(true);
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'processing' || status === 'completed') {
        updateData.processed_at = new Date().toISOString();
      }

      if (notes) {
        updateData.admin_notes = notes;
      }

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('payout_requests')
        .update(updateData)
        .eq('id', payoutId);

      if (error) throw error;

      setPayoutRequests(prev =>
        prev.map(request =>
          request.id === payoutId
            ? { ...request, ...updateData } as PayoutRequestWithDetails
            : request
        )
      );

      toast({
        title: 'Success',
        description: `Payout request ${status} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating payout request:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payout request',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  return {
    affiliateUsers,
    payoutRequests,
    loading,
    updating,
    updateAffiliateEligibility,
    updatePayoutRequest,
    refreshData: () => {
      fetchAffiliateUsers();
      fetchPayoutRequests();
    },
    // Pagination and filtering
    currentPage,
    totalPages,
    totalUsers,
    searchQuery,
    statusFilter,
    setCurrentPage,
    setSearchQuery,
    setStatusFilter,
    itemsPerPage
  };
};