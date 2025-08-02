import { useAuth } from '@/hooks/useAuth';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import PricingDialog from './PricingDialog';
import { useState } from 'react';

interface PremiumProtectedRouteProps {
  children: React.ReactNode;
  featureKey: string;
}

const PremiumProtectedRoute = ({ children, featureKey }: PremiumProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { canAccessFeature, loading: featuresLoading } = usePremiumFeatures();
  const [showPricingDialog, setShowPricingDialog] = useState(false);

  if (authLoading || featuresLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!canAccessFeature(featureKey)) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Premium Feature Required</h2>
            <p className="text-muted-foreground">
              This feature requires a premium subscription to access.
            </p>
            <button
              onClick={() => setShowPricingDialog(true)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
        {showPricingDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <PricingDialog />
              <button
                onClick={() => setShowPricingDialog(false)}
                className="mt-4 px-4 py-2 bg-muted rounded-md hover:bg-muted/80"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default PremiumProtectedRoute;