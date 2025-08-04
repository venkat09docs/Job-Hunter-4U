import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  username?: string;
  profile_image_url?: string | null;
  subscription_plan: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  subscription_active: boolean | null;
  total_resume_opens: number;
  total_job_searches: number;
  total_ai_queries: number;
  bio_link_url?: string | null;
  digital_profile_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  leetcode_url?: string | null;
  created_at: string;
  updated_at: string;
}

interface Analytics {
  date: string;
  resume_opens: number;
  job_searches: number;
  ai_queries: number;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAnalytics();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - this is expected for new users
          console.log('No profile found for user, this is normal for new users');
          setProfile(null);
          return;
        }
        throw error;
      }
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      // Only show toast for unexpected errors, not for missing profiles
      if (error.code !== 'PGRST116') {
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Get last 7 days of analytics
      const { data, error } = await supabase
        .from('user_analytics')
        .select('date, resume_opens, job_searches, ai_queries')
        .eq('user_id', user?.id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    }
  };

  const incrementAnalytics = async (actionType: 'resume_open' | 'job_search' | 'ai_query') => {
    try {
      const { error } = await supabase.rpc('increment_user_analytics', {
        action_type: actionType
      });

      if (error) throw error;
      
      // Refresh data
      fetchProfile();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error incrementing analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to update analytics',
        variant: 'destructive'
      });
    }
  };

  const updateSubscription = async (plan: string, startDate: string, endDate: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_plan: plan,
          subscription_start_date: startDate,
          subscription_end_date: endDate,
          subscription_active: true
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { 
        ...prev, 
        subscription_plan: plan,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
        subscription_active: true
      } : null);
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive'
      });
    }
  };

  const getRemainingDays = () => {
    if (!profile?.subscription_end_date) return 0;
    
    // Parse the end date (handles both timestamp and date-only formats)
    const endDate = new Date(profile.subscription_end_date);
    const now = new Date();
    
    // Reset current time to start of day for consistent calculation
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const diffTime = endDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const hasActiveSubscription = () => {
    return profile?.subscription_active && getRemainingDays() > 0;
  };

  return {
    profile,
    analytics,
    loading,
    incrementAnalytics,
    updateSubscription,
    getRemainingDays,
    hasActiveSubscription,
    refreshProfile: fetchProfile,
    refreshAnalytics: fetchAnalytics
  };
};