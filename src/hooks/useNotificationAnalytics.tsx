import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRole } from './useRole';

interface AnalyticsSummary {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
}

interface NotificationTrigger {
  id: string;
  trigger_name: string;
  trigger_type: string;
  conditions: any;
  notification_template: string;
  target_roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserNotificationSettings {
  id: string;
  user_id: string;
  timezone: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  weekend_notifications: boolean;
  max_daily_notifications: number;
  digest_frequency: string;
  digest_time: string;
  notification_methods: any;
}

export function useNotificationAnalytics() {
  const { user } = useAuth();
  const { isAdmin, isRecruiter } = useRole();
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0,
    open_rate: 0,
    click_rate: 0
  });
  const [triggers, setTriggers] = useState<NotificationTrigger[]>([]);
  const [userSettings, setUserSettings] = useState<UserNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      if (isAdmin || isRecruiter) {
        fetchAnalytics();
        fetchTriggers();
      }
      fetchUserSettings();
    }
  }, [user, isAdmin, isRecruiter]);

  const fetchAnalytics = async (dateRange: number = 30) => {
    if (!isAdmin && !isRecruiter) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      
      const { data, error } = await supabase.rpc('get_notification_analytics_summary', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAnalytics(data[0]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchTriggers = async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('admin_notification_triggers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error) {
      console.error('Error fetching triggers:', error);
    }
  };

  const fetchUserSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Create default settings if none exist
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_notification_settings')
          .insert({
            user_id: user.id,
            timezone: 'UTC',
            quiet_hours_start: '22:00',
            quiet_hours_end: '08:00',
            weekend_notifications: true,
            max_daily_notifications: 10,
            digest_frequency: 'daily',
            digest_time: '09:00',
            notification_methods: {
              in_app: true,
              email: true,
              sms: false,
              push: true
            }
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        setUserSettings(newSettings);
      } else {
        setUserSettings(data);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserSettings = async (settings: Partial<UserNotificationSettings>) => {
    if (!user || !userSettings) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .update(settings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUserSettings(data);
      return { success: true };
    } catch (error) {
      console.error('Error updating user settings:', error);
      return { success: false, error };
    }
  };

  const toggleTrigger = async (triggerId: string, isActive: boolean) => {
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    try {
      const { error } = await supabase
        .from('admin_notification_triggers')
        .update({ is_active: !isActive })
        .eq('id', triggerId);

      if (error) throw error;

      setTriggers(prev => prev.map(t => 
        t.id === triggerId ? { ...t, is_active: !isActive } : t
      ));

      return { success: true };
    } catch (error) {
      console.error('Error updating trigger:', error);
      return { success: false, error };
    }
  };

  const sendBulkNotification = async (notificationData: {
    title: string;
    message: string;
    target_roles: string[];
    priority: string;
    category: string;
  }) => {
    if (!isAdmin && !isRecruiter) return { success: false, error: 'Unauthorized' };

    try {
      const { data, error } = await supabase.rpc('send_admin_notification', {
        notification_title: notificationData.title,
        notification_message: notificationData.message,
        target_roles: notificationData.target_roles,
        priority: notificationData.priority,
        notification_category: notificationData.category
      });

      if (error) throw error;
      
      return { success: true, sentCount: data };
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      return { success: false, error };
    }
  };

  const trackNotificationEvent = async (
    notificationId: string,
    eventType: 'opened' | 'clicked' | 'dismissed',
    metadata: any = {}
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('track_notification_event', {
        notification_id: notificationId,
        user_id: user.id,
        event_type: eventType,
        metadata: { ...metadata, timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Error tracking notification event:', error);
    }
  };

  const scheduleSmartNotification = async (payload: {
    user_id: string;
    title: string;
    message: string;
    priority?: string;
    scheduled_for?: string;
  }) => {
    try {
      const response = await fetch('https://moirryvajzyriagqihbe.supabase.co/functions/v1/smart-notification-scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          task: 'smart_schedule_notification',
          payload
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error scheduling smart notification:', error);
      return { success: false, error };
    }
  };

  return {
    analytics,
    triggers,
    userSettings,
    loading,
    fetchAnalytics,
    updateUserSettings,
    toggleTrigger,
    sendBulkNotification,
    trackNotificationEvent,
    scheduleSmartNotification,
    refetch: () => {
      fetchAnalytics();
      fetchTriggers();
      fetchUserSettings();
    }
  };
}