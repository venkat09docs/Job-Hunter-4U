import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface PremiumFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_premium: boolean;
}

const usePremiumFeatures = () => {
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const { hasActiveSubscription, loading: profileLoading } = useProfile();

  useEffect(() => {
    fetchPremiumFeatures();
  }, []);

  const fetchPremiumFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_features')
        .select('*')
        .order('feature_name');
      
      if (error) throw error;
      setPremiumFeatures(data || []);
    } catch (error) {
      // Ignore premium features errors - they're not critical
    } finally {
      setFeaturesLoading(false);
    }
  };

  const isFeaturePremium = (featureKey: string): boolean => {
    const feature = premiumFeatures.find(f => f.feature_key === featureKey);
    return feature?.is_premium || false;
  };

  const canAccessFeature = (featureKey: string): boolean => {
    const isPremium = isFeaturePremium(featureKey);
    if (!isPremium) return true;
    return hasActiveSubscription();
  };

  const getFeatureInfo = (featureKey: string) => {
    return premiumFeatures.find(f => f.feature_key === featureKey);
  };

  return {
    premiumFeatures,
    loading: featuresLoading || profileLoading,
    isFeaturePremium,
    canAccessFeature,
    getFeatureInfo,
    refreshFeatures: fetchPremiumFeatures
  };
};

export { usePremiumFeatures };