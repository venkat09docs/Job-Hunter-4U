import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

interface UsageInfo {
  isPremium: boolean;
  remainingCredits: number;
  canAnalyze: boolean;
  limitReached: boolean;
  message: string;
  currentCount?: number;
}

export const useResumeAnalysisUsage = () => {
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchUsage = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_resume_analysis_usage', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data && typeof data === 'object') {
        const result = data as any;
        setUsageInfo({
          isPremium: result.is_premium ?? false,
          remainingCredits: result.remaining_credits ?? 0,
          canAnalyze: result.can_analyze ?? false,
          limitReached: result.limit_reached ?? false,
          message: result.message ?? '',
          currentCount: result.current_count
        });
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (): Promise<{ success: boolean; message: string; limitReached: boolean }> => {
    if (!user) {
      return { success: false, message: 'User not authenticated', limitReached: false };
    }

    try {
      const { data, error } = await supabase.rpc('increment_resume_analysis_count', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from server');
      }

      const result = data as any;

      // Update local usage info
      setUsageInfo({
        isPremium: result.is_premium,
        remainingCredits: result.remaining_credits,
        canAnalyze: !result.limit_reached,
        limitReached: result.limit_reached,
        message: result.message,
        currentCount: result.current_count
      });

      return {
        success: result.success,
        message: result.message,
        limitReached: result.limit_reached
      };
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return {
        success: false,
        message: 'Failed to update usage count',
        limitReached: false
      };
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  return {
    usageInfo,
    loading,
    refreshUsage: fetchUsage,
    incrementUsage
  };
};