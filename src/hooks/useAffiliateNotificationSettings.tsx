import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AffiliateNotificationSettings {
  id?: string;
  affiliate_user_id: string;
  payout_notifications: boolean;
  referral_notifications: boolean;
  commission_notifications: boolean;
  email_notifications: boolean;
  auto_payout_enabled: boolean;
  auto_payout_threshold: number;
  created_at?: string;
  updated_at?: string;
}

export const useAffiliateNotificationSettings = (affiliateUserId?: string) => {
  const [settings, setSettings] = useState<AffiliateNotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!affiliateUserId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('affiliate_notification_settings')
        .select('*')
        .eq('affiliate_user_id', affiliateUserId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching affiliate notification settings:', error);
        return;
      }

      if (data) {
        setSettings(data as AffiliateNotificationSettings);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          affiliate_user_id: affiliateUserId,
          payout_notifications: true,
          referral_notifications: true,
          commission_notifications: true,
          email_notifications: true,
          auto_payout_enabled: false,
          auto_payout_threshold: 1000.00
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('affiliate_notification_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default settings:', insertError);
          return;
        }

        setSettings(newData as AffiliateNotificationSettings);
      }
    } catch (error) {
      console.error('Error fetching affiliate notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedSettings: Partial<AffiliateNotificationSettings>) => {
    if (!settings?.id || !affiliateUserId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('affiliate_notification_settings')
        .update(updatedSettings)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data as AffiliateNotificationSettings);
      
      toast({
        title: "Settings Updated",
        description: "Your affiliate notification settings have been saved successfully",
      });
    } catch (error: any) {
      console.error('Error updating affiliate notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [affiliateUserId]);

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings
  };
};