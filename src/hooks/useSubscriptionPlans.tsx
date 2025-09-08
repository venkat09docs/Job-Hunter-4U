import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  price_paisa: number;
  original_price_paisa: number;
  duration_days: number;
  features: any;
  is_active: boolean;
  description: string;
  discount_per_member: number;
  member_limit: number;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_paisa', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subscription plans',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Convert paisa to rupees for display
  const getPlansWithPrices = () => {
    return plans.map(plan => ({
      ...plan,
      price: plan.price_paisa / 100,
      originalPrice: plan.original_price_paisa / 100,
      duration: plan.duration_days > 1 ? `${plan.duration_days} days` : `${plan.duration_days} day`
    }));
  };

  return {
    plans,
    plansWithPrices: getPlansWithPrices(),
    loading,
    refreshPlans: fetchPlans
  };
};