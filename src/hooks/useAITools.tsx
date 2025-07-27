import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AITool {
  id: string;
  tool_name: string;
  tool_description: string | null;
  embed_code: string;
  credit_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface ToolUsage {
  id: string;
  user_id: string;
  tool_id: string;
  credits_used: number;
  used_at: string;
}

export const useAITools = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tools, setTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTools(data || []);
    } catch (error: any) {
      console.error('Error fetching tools:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI tools',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTool = async (toolData: Omit<AITool, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .insert([{
          ...toolData,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchTools();
      toast({
        title: 'Success',
        description: 'AI tool created successfully'
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to create AI tool',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateTool = async (id: string, updates: Partial<AITool>) => {
    try {
      const { error } = await supabase
        .from('ai_tools')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchTools();
      toast({
        title: 'Success',
        description: 'AI tool updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to update AI tool',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteTool = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchTools();
      toast({
        title: 'Success',
        description: 'AI tool deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete AI tool',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const useTool = async (toolId: string, creditPoints: number) => {
    try {
      // Record tool usage
      const { error: usageError } = await supabase
        .from('tool_usage')
        .insert([{
          user_id: user?.id,
          tool_id: toolId,
          credits_used: creditPoints
        }]);

      if (usageError) throw usageError;

      // Deduct credits from user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tokens_remaining')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      const newTokenCount = Math.max(0, (profile.tokens_remaining || 0) - creditPoints);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tokens_remaining: newTokenCount })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: 'Tool Accessed',
        description: `${creditPoints} credits deducted. Remaining: ${newTokenCount}`,
      });

      return { success: true, remainingCredits: newTokenCount };
    } catch (error: any) {
      console.error('Error using tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to access tool',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return {
    tools,
    loading,
    createTool,
    updateTool,
    deleteTool,
    useTool,
    refreshTools: fetchTools
  };
};