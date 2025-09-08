import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AffiliatePlanCommission {
  id: string;
  plan_name: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const useAffiliatePlanCommissions = () => {
  const [planCommissions, setPlanCommissions] = useState<AffiliatePlanCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlanCommissions();
  }, []);

  const fetchPlanCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_plan_commissions')
        .select('*')
        .order('plan_name');

      if (error) throw error;
      setPlanCommissions(data || []);
    } catch (error) {
      console.error('Error fetching plan commissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch plan commissions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCommissionRate = async (id: string, commission_rate: number) => {
    try {
      const { error } = await supabase
        .from('affiliate_plan_commissions')
        .update({ 
          commission_rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setPlanCommissions(prev => prev.map(plan => 
        plan.id === id ? { ...plan, commission_rate } : plan
      ));

      toast({
        title: 'Success',
        description: 'Commission rate updated successfully'
      });
    } catch (error) {
      console.error('Error updating commission rate:', error);
      toast({
        title: 'Error',
        description: 'Failed to update commission rate',
        variant: 'destructive'
      });
    }
  };

  const togglePlanActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('affiliate_plan_commissions')
        .update({ 
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setPlanCommissions(prev => prev.map(plan => 
        plan.id === id ? { ...plan, is_active } : plan
      ));

      toast({
        title: 'Success',
        description: `Plan ${is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update plan status',
        variant: 'destructive'
      });
    }
  };

  return {
    planCommissions,
    loading,
    fetchPlanCommissions,
    updateCommissionRate,
    togglePlanActive,
    refreshData: fetchPlanCommissions
  };
};