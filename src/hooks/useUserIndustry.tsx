import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserIndustry = () => {
  const [industry, setIndustry] = useState<'IT' | 'Non-IT' | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserIndustry();
    } else {
      setIndustry(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserIndustry = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('industry')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user industry:', error);
        setIndustry('IT'); // Default to IT if error
      } else {
        const userIndustry = data?.industry as 'IT' | 'Non-IT';
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
      const { error } = await supabase
        .from('profiles')
        .update({ industry: newIndustry })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating user industry:', error);
        return false;
      }

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