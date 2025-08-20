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
  image_url?: string | null;
  category_id?: string | null;
}

interface AIToolCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
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
  const [categories, setCategories] = useState<AIToolCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetchTools();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_tool_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    } finally {
      setCategoriesLoading(false);
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

  const createCategory = async (categoryData: Omit<AIToolCategory, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('ai_tool_categories')
        .insert([{
          ...categoryData,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchCategories();
      toast({
        title: 'Success',
        description: 'Category created successfully'
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<AIToolCategory>) => {
    try {
      const { error } = await supabase
        .from('ai_tool_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchCategories();
      toast({
        title: 'Success',
        description: 'Category updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_tool_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchCategories();
      toast({
        title: 'Success',
        description: 'Category deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
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

      // Check if user has active subscription instead of tokens
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_active, subscription_end_date')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Check if subscription is active and not expired
      const hasActiveSubscription = profile.subscription_active && 
        profile.subscription_end_date && 
        new Date(profile.subscription_end_date) > new Date();

      if (!hasActiveSubscription) {
        toast({
          title: 'Subscription Required',
          description: 'You need an active subscription to use this tool. Please upgrade your plan.',
          variant: 'destructive'
        });
        return { success: false, remainingCredits: 0 };
      }

      toast({
        title: 'Tool Accessed',
        description: 'Tool accessed successfully with your active subscription.',
        duration: 3000, // Auto-dismiss after 3 seconds
      });

      return { success: true, remainingCredits: 1 };
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
    categories,
    loading,
    categoriesLoading,
    createTool,
    updateTool,
    deleteTool,
    createCategory,
    updateCategory,
    deleteCategory,
    useTool,
    refreshTools: fetchTools,
    refreshCategories: fetchCategories
  };
};