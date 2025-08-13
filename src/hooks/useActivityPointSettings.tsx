import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ActivityPointSetting {
  id: string;
  activity_type: string;
  activity_id: string;
  activity_name: string;
  points: number;
  description?: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useActivityPointSettings = () => {
  const [settings, setSettings] = useState<ActivityPointSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchActivityPointSettings();
    }
  }, [user]);

  const fetchActivityPointSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_point_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('activity_name', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching activity point settings:', error);
      toast.error('Failed to load activity point settings');
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateActivityPoints = async (id: string, points: number) => {
    try {
      const { error } = await supabase
        .from('activity_point_settings')
        .update({ 
          points,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSettings(prev => 
        prev.map(setting => 
          setting.id === id 
            ? { ...setting, points, updated_at: new Date().toISOString() }
            : setting
        )
      );
      
      toast.success('Points updated successfully');
    } catch (error) {
      console.error('Error updating activity points:', error);
      toast.error('Failed to update points');
      throw error;
    }
  };

  const toggleActivityStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('activity_point_settings')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSettings(prev => 
        prev.map(setting => 
          setting.id === id 
            ? { ...setting, is_active: isActive, updated_at: new Date().toISOString() }
            : setting
        )
      );
      
      toast.success(`Activity ${isActive ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating activity status:', error);
      toast.error('Failed to update activity status');
      throw error;
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  return {
    settings,
    loading,
    updateActivityPoints,
    toggleActivityStatus,
    getSettingsByCategory,
    refreshSettings: fetchActivityPointSettings
  };
};