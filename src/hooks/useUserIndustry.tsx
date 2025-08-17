import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserIndustry = () => {
  const [industry, setIndustry] = useState<'IT' | 'Non-IT' | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && !fetchAttempted) {
      console.log('🏭 Fetching industry for user:', user.id);
      fetchUserIndustry();
    } else if (!user) {
      console.log('🏭 No user found, setting industry to null');
      setIndustry(null);
      setLoading(false);
      setFetchAttempted(false);
    }
  }, [user?.id, fetchAttempted]);

  const fetchUserIndustry = async () => {
    if (!user || fetchAttempted) return;
    
    try {
      setLoading(true);
      setFetchAttempted(true);
      console.log('🏭 Fetching industry for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('industry')
        .eq('user_id', user.id)
        .single();

      console.log('🏭 Industry fetch result:', { data, error });

      if (error) {
        console.error('Error fetching user industry:', error);
        setIndustry(null); // Set to null if error, so dialog can show
      } else {
        const userIndustry = data?.industry as 'IT' | 'Non-IT' | null;
        console.log('🏭 Setting industry to:', userIndustry);
        setIndustry(userIndustry);
      }
    } catch (error) {
      console.error('Error fetching user industry:', error);
      setIndustry(null); // Set to null if error, so dialog can show
    } finally {
      setLoading(false);
    }
  };

  const updateIndustry = async (newIndustry: 'IT' | 'Non-IT') => {
    if (!user) return false;

    try {
      console.log('🏭 Updating industry in database:', { userId: user.id, newIndustry });
      
      const { error } = await supabase
        .from('profiles')
        .update({ industry: newIndustry })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating user industry:', error);
        return false;
      }

      console.log('🏭 Industry updated in database, setting local state');
      setIndustry(newIndustry);
      return true;
    } catch (error) {
      console.error('Error updating user industry:', error);
      return false;
    }
  };

  const isIT = () => industry === 'IT';
  const isNonIT = () => industry === 'Non-IT';

  return {
    industry,
    loading,
    isIT,
    isNonIT,
    updateIndustry,
    refreshIndustry: fetchUserIndustry,
    fetchAttempted
  };
};