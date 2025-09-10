import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useJobHuntingExtensionRequests = (assignmentId: string, userId?: string) => {
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPendingRequest = async () => {
    if (!userId || !assignmentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('job_hunting_extension_requests')
        .select('id, status')
        .eq('user_id', userId)
        .eq('assignment_id', assignmentId)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (error) {
        console.error('Error checking extension requests:', error);
        setHasPendingRequest(false);
      } else {
        // Only show as pending if status is 'pending', not 'approved'
        setHasPendingRequest(data?.status === 'pending');
      }
    } catch (error) {
      console.error('Error checking extension requests:', error);
      setHasPendingRequest(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPendingRequest();
    
    // Set up real-time subscription to listen for changes to extension requests
    if (userId && assignmentId) {
      const channel = supabase
        .channel(`job-hunting-extension-requests-${assignmentId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'job_hunting_extension_requests',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('🔄 Extension request change detected:', payload);
            // Refresh the pending status when changes occur
            setTimeout(() => {
              checkPendingRequest();
            }, 500);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [assignmentId, userId]);

  const refreshPendingStatus = () => {
    checkPendingRequest();
  };

  return {
    hasPendingRequest,
    loading,
    refreshPendingStatus
  };
};