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
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'extension_request')
        .ilike('message', `%${assignmentId}%`)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking pending extension requests:', error);
        setHasPendingRequest(false);
      } else {
        setHasPendingRequest(!!data);
      }
    } catch (error) {
      console.error('Error checking pending extension requests:', error);
      setHasPendingRequest(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPendingRequest();
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