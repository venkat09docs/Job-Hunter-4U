import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import type { Json } from '@/integrations/supabase/types';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ToolChat {
  id: string;
  user_id: string;
  tool_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export const useToolChats = (toolId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<ToolChat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (toolId) {
      fetchChats();
    }
  }, [toolId]);

  const fetchChats = async () => {
    if (!toolId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tool_chats')
        .select('*')
        .eq('tool_id', toolId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle JSON conversion
      const transformedChats = (data || []).map(chat => ({
        ...chat,
        messages: Array.isArray(chat.messages) ? (chat.messages as unknown as ChatMessage[]) : []
      }));
      
      setChats(transformedChats);
    } catch (error: any) {
      console.error('Error fetching chats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (title: string, initialMessages: ChatMessage[] = []) => {
    if (!toolId || !user) return null;

    try {
      const { data, error } = await supabase
        .from('tool_chats')
        .insert([{
          user_id: user.id,
          tool_id: toolId,
          title,
          messages: initialMessages as unknown as Json
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchChats();
      toast({
        title: 'Success',
        description: 'Chat saved successfully'
      });

      return data;
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to save chat',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateChat = async (chatId: string, updates: { title?: string; messages?: ChatMessage[] }) => {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.messages) updateData.messages = updates.messages as unknown as Json;

      const { error } = await supabase
        .from('tool_chats')
        .update(updateData)
        .eq('id', chatId);

      if (error) throw error;

      await fetchChats();
    } catch (error: any) {
      console.error('Error updating chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to update chat',
        variant: 'destructive'
      });
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('tool_chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      await fetchChats();
      toast({
        title: 'Success',
        description: 'Chat deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive'
      });
    }
  };

  return {
    chats,
    loading,
    createChat,
    updateChat,
    deleteChat,
    refreshChats: fetchChats
  };
};