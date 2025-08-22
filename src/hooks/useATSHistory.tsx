import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ATSHistoryEntry {
  id: string;
  resume_name: string;
  role: string;
  job_description: string;
  ats_score: number;
  analysis_result: { content: string };
  created_at: string;
}

export const useATSHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ATSHistoryEntry[]>([]);

  const saveATSResult = async (
    resumeName: string,
    role: string,
    jobDescription: string,
    atsScore: number,
    analysisResult: string
  ) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('https://moirryvajzyriagqihbe.supabase.co/functions/v1/verify-ats-score/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          resumeName,
          role,
          jobDescription,
          atsScore,
          analysisResult
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save ATS result');
      }

      toast.success('ATS score saved successfully!');
      return result.data;
    } catch (error) {
      console.error('Error saving ATS result:', error);
      toast.error('Failed to save ATS result');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchATSHistory = async (resumeName: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://moirryvajzyriagqihbe.supabase.co/functions/v1/verify-ats-score/history?resumeName=${encodeURIComponent(resumeName)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch ATS history');
      }

      setHistory(result.data);
      return result.data;
    } catch (error) {
      console.error('Error fetching ATS history:', error);
      toast.error('Failed to fetch ATS history');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteATSHistory = async (resumeName: string) => {
    try {
      const { error } = await supabase
        .from('ats_score_history')
        .delete()
        .eq('resume_name', resumeName);

      if (error) {
        throw error;
      }

      setHistory([]);
    } catch (error) {
      console.error('Error deleting ATS history:', error);
      toast.error('Failed to delete ATS history');
      throw error;
    }
  };

  return {
    isLoading,
    history,
    saveATSResult,
    fetchATSHistory,
    deleteATSHistory
  };
};