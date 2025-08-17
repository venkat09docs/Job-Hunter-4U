import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserIndustry = () => {
  const [industry, setIndustry] = useState<'IT' | 'Non-IT' | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && industry === null) {
      console.log('🏭 Fetching industry for user:', user.id);
      fetchUserIndustry();
    } else if (!user) {
      console.log('🏭 No user found, setting industry to null');
      setIndustry(null);
      setLoading(false);
    } else if (user?.id && industry !== null) {
      console.log('🏭 User has industry already, skipping fetch:', industry);
      setLoading(false);
    }
  }, [user?.id]);

  const fetchUserIndustry = async () => {
    if (!user) return;
    
    // Prevent multiple fetches if already loading or has industry
    if (loading || industry !== null) {
      console.log('🏭 Skipping fetch - already loading or has industry:', { loading, industry });
      return;
    }

    try {
      setLoading(true);
      console.log('🏭 Fetching industry for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('industry')
        .eq('user_id', user.id)
        .single();

      console.log('🏭 Industry fetch result:', { data, error });

      if (error) {
        console.error('Error fetching user industry:', error);
        setIndustry('IT'); // Default to IT if error
      } else {
        const userIndustry = data?.industry as 'IT' | 'Non-IT';
        console.log('🏭 Setting industry to:', userIndustry || 'IT');
        setIndustry(userIndustry || 'IT');
      }
    } catch (error) {
      console.error('Error fetching user industry:', error);
      setIndustry('IT'); // Default to IT if error
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
    refreshIndustry: fetchUserIndustry
  };
};