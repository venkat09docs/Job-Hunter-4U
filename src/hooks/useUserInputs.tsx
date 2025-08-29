import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserInput {
  id: string;
  user_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export const useUserInputs = () => {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInputs();
    }
  }, [user]);

  const fetchInputs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_inputs')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const inputsMap: Record<string, string> = {};
      data?.forEach(input => {
        inputsMap[input.key] = input.value;
      });

      setInputs(inputsMap);
    } catch (error) {
      console.error('Error fetching user inputs:', error);
      // Don't show error toast for empty user inputs - just set empty object
      setInputs({});
    } finally {
      setLoading(false);
    }
  };

  const saveInput = async (key: string, value: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_inputs')
        .upsert({
          user_id: user.id,
          key,
          value
        });

      if (error) throw error;

      setInputs(prev => ({ ...prev, [key]: value }));
      toast.success('Setting saved successfully!');
    } catch (error) {
      console.error('Error saving user input:', error);
      toast.error('Failed to save setting');
    }
  };

  const getInput = (key: string): string => {
    return inputs[key] || '';
  };

  return {
    inputs,
    loading,
    saveInput,
    getInput,
    refreshInputs: fetchInputs
  };
};