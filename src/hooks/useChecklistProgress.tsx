import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ChecklistProgress {
  checklist_item_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export const useChecklistProgress = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getChecklistProgress = async (chapterId: string): Promise<ChecklistProgress[]> => {
    if (!user?.id) return [];
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_checklist_progress', {
        chapter_id_param: chapterId,
        user_id_param: user.id
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching checklist progress:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistItemProgress = async (
    chapterId: string,
    checklistItemId: string,
    isCompleted: boolean
  ): Promise<boolean> => {
    if (!user?.id) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('update_checklist_item_progress', {
        chapter_id_param: chapterId,
        checklist_item_id_param: checklistItemId,
        is_completed_param: isCompleted,
        user_id_param: user.id
      });

      if (error) throw error;
      
      toast({
        title: isCompleted ? "Item completed!" : "Item unchecked",
        description: isCompleted 
          ? "Great job! Keep going with your checklist." 
          : "Item marked as incomplete.",
      });

      return true;
    } catch (error) {
      console.error('Error updating checklist progress:', error);
      toast({
        title: "Error",
        description: "Failed to update checklist progress",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const mergeChecklistWithProgress = (
    checklistItems: string[],
    progress: ChecklistProgress[]
  ): ChecklistItem[] => {
    return checklistItems.map((item, index) => {
      const itemId = `item_${index}`;
      const progressItem = progress.find(p => p.checklist_item_id === itemId);
      
      return {
        id: itemId,
        text: item,
        completed: progressItem?.is_completed || false
      };
    });
  };

  const getChecklistCompletionPercentage = (checklist: ChecklistItem[]): number => {
    if (checklist.length === 0) return 0;
    const completedItems = checklist.filter(item => item.completed).length;
    return Math.round((completedItems / checklist.length) * 100);
  };

  return {
    loading,
    getChecklistProgress,
    updateChecklistItemProgress,
    mergeChecklistWithProgress,
    getChecklistCompletionPercentage
  };
};