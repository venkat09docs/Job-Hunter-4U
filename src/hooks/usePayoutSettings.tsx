import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PayoutSettings {
  id?: string;
  affiliate_user_id: string;
  payment_method: string;
  account_details: string;
  account_holder_name: string;
  ifsc_code?: string;
  bank_name?: string;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export const usePayoutSettings = (affiliateId: string) => {
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPayoutSettings = async () => {
    if (!affiliateId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payout_settings' as any)
        .select('*')
        .eq('affiliate_user_id', affiliateId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching payout settings:', error);
        return;
      }

      setPayoutSettings(data as unknown as PayoutSettings | null);
    } catch (error) {
      console.error('Error fetching payout settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutSettings = async (settingsData: Partial<PayoutSettings>) => {
    if (!affiliateId) return;

    try {
      setLoading(true);
      
      const payload = {
        affiliate_user_id: affiliateId,
        ...settingsData,
        updated_at: new Date().toISOString()
      };

      if (payoutSettings?.id) {
        // Update existing settings
        const { data, error } = await supabase
          .from('payout_settings' as any)
          .update(payload)
          .eq('id', payoutSettings.id)
          .select()
          .single();

        if (error) throw error;
        setPayoutSettings(data as unknown as PayoutSettings);
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('payout_settings' as any)
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setPayoutSettings(data as unknown as PayoutSettings);
      }
      
      await fetchPayoutSettings();
    } catch (error) {
      console.error('Error updating payout settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutSettings();
  }, [affiliateId]);

  return {
    payoutSettings,
    loading,
    updatePayoutSettings,
    refreshSettings: fetchPayoutSettings
  };
};