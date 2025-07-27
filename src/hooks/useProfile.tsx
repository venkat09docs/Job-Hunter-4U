import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  tokens_remaining: number;
  total_resume_opens: number;
  total_job_searches: number;
  total_ai_queries: number;
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

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
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

  const updateTokens = async (newTokenCount: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ tokens_remaining: newTokenCount })
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, tokens_remaining: newTokenCount } : null);
    } catch (error: any) {
      console.error('Error updating tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tokens',
        variant: 'destructive'
      });
    }
  };

  return {
    profile,
    analytics,
    loading,
    incrementAnalytics,
    updateTokens,
    refreshProfile: fetchProfile,
    refreshAnalytics: fetchAnalytics
  };
};