import { useEffect } from 'react';
import { useTrackSocialProof } from '@/hooks/useTrackSocialProof';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to automatically track social proof events from payment completions
 */
export const usePaymentSocialProof = () => {
  const { user } = useAuth();
  const { trackPremiumUpgrade } = useTrackSocialProof();

  useEffect(() => {
    if (!user) return;

    // Subscribe to payment completions for the current user
    const paymentsSubscription = supabase
      .channel('payment-completions')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'payments',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        const payment = payload.new;
        
        // Track social proof when payment status changes to completed
        if (payment.status === 'completed' && payload.old?.status !== 'completed') {
          await trackPremiumUpgrade(payment.plan_name);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsSubscription);
    };
  }, [user, trackPremiumUpgrade]);

  return null; // This hook is for side effects only
};