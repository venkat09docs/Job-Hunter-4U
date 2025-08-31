import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRole } from './useRole';

interface NotificationTemplate {
  id: string;
  template_key: string;
  title_template: string;
  message_template: string;
  email_subject_template?: string;
  email_body_template?: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotificationManagement() {
  const { user } = useAuth();
  const { isAdmin, isRecruiter } = useRole();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAccess = isAdmin || isRecruiter;

  useEffect(() => {
    if (user && hasAccess) {
      fetchTemplates();
    }
  }, [user, hasAccess]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('title_template');

      if (error) throw error;
      setTemplates(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (!hasAccess) return { success: false, error: 'Unauthorized' };

    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchTemplates();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating template:', error);
      return { success: false, error };
    }
  };

  const updateTemplate = async (id: string, templateData: Partial<NotificationTemplate>) => {
    if (!hasAccess) return { success: false, error: 'Unauthorized' };

    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .update(templateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchTemplates();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating template:', error);
      return { success: false, error };
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!hasAccess) return { success: false, error: 'Unauthorized' };

    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchTemplates();
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      return { success: false, error };
    }
  };

  // Simplified for existing structure - no schedules table yet
  const createSchedule = async () => ({ success: false, error: 'Not implemented' });
  const updateSchedule = async () => ({ success: false, error: 'Not implemented' });
  const deleteSchedule = async () => ({ success: false, error: 'Not implemented' });

  const testTemplate = async (templateId: string, testData: any) => {
    if (!hasAccess) return { success: false, error: 'Unauthorized' };

    try {
      const { data, error } = await supabase.functions.invoke('smart-notification-scheduler', {
        body: {
          task: 'test_template',
          payload: {
            template_id: templateId,
            test_data: testData,
            user_id: user?.id
          }
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error testing template:', error);
      return { success: false, error };
    }
  };

  return {
    templates,
    schedules: [], // Empty for now
    loading,
    hasAccess,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    testTemplate,
    refetch: fetchTemplates
  };
}