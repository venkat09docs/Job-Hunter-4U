import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useNavigate } from 'react-router-dom';
import { clearSubscriptionCache } from '@/utils/cacheManager';

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
  industry?: string | null;
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
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchAnalytics();
    } else {
      setLoading(false);
      setProfile(null);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no profile exists, create one
      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.email?.split('@')[0] || 'User',
            email: user.email,
            industry: 'IT'
          })
          .select()
          .single();

        if (createError) {
          console.error('Profile creation failed:', createError);
          toast({
            title: 'Profile Error',
            description: 'Unable to create user profile. Please sign in again.',
            variant: 'destructive'
          });
          await signOut();
          navigate('/auth');
          return;
        } else {
          setProfile(newProfile);
        }
      } else {
        setProfile(data);
      }
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      toast({
        title: 'Profile Error',
        description: 'Unable to load user profile. Please sign in again.',
        variant: 'destructive'
      });
      await signOut();
      navigate('/auth');
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
      // Ignore analytics errors - they're not critical
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
      
      // Clear cache to ensure fresh data
      clearSubscriptionCache(user?.id);
      
      setProfile(prev => prev ? { 
        ...prev, 
        subscription_plan: plan,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
        subscription_active: true
      } : null);
    } catch (error: any) {
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
    subscriptionPlan: profile?.subscription_plan,
    refreshProfile: fetchProfile,
    refreshAnalytics: fetchAnalytics
  };
};