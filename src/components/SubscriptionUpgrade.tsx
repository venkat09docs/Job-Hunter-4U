import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Crown, Settings } from 'lucide-react';
import PricingDialog from '@/components/PricingDialog';
import ManageSubscriptionDialog from '@/components/ManageSubscriptionDialog';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionUpgradeProps {
  children?: React.ReactNode;
  featureName?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  eligiblePlans?: string[];
}

export const SubscriptionUpgrade = ({ 
  children, 
  featureName = "this feature",
  variant = "default",
  size = "default",
  className = "",
  eligiblePlans
}: SubscriptionUpgradeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const { hasActiveSubscription, getRemainingDays } = useProfile();

  // Debug logging
  console.log('🔍 SubscriptionUpgrade Debug:', {
    featureName,
    eligiblePlans,
    hasEligiblePlans: !!eligiblePlans,
    eligiblePlansLength: eligiblePlans?.length || 0
  });

  const hasValidSubscription = hasActiveSubscription();

  const handleManageSubscription = () => {
    setManageDialogOpen(true);
  };

  // Handle scroll restoration when dialog closes
  useEffect(() => {
    const handleDialogClose = () => {
      if (!isOpen) {
        // Force scroll restoration
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.documentElement.style.overflow = '';
        
        // Ensure the main content can scroll
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.style.overflow = '';
        }
      }
    };

    handleDialogClose();
  }, [isOpen]);

  if (hasValidSubscription) {
    return (
      <>
        <div onClick={handleManageSubscription}>
          {children || (
            <Button variant={variant} size={size} className={className}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Plans
            </Button>
          )}
        </div>
        <ManageSubscriptionDialog 
          open={manageDialogOpen} 
          onOpenChange={setManageDialogOpen} 
        />
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      // Additional cleanup when closing
      if (!open) {
        setTimeout(() => {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
          document.documentElement.style.overflow = '';
        }, 100);
      }
    }}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button variant={variant} size={size} className={className}>
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to access {featureName}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] overflow-y-auto p-6"
        onCloseAutoFocus={(e) => {
          // Prevent focus issues that might affect scroll
          e.preventDefault();
        }}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-center">Upgrade Your Subscription</DialogTitle>
        </DialogHeader>
        <div className="mb-6">
          <p className="text-muted-foreground text-center">
            You need an active subscription to access {featureName}. Choose a plan that works for you:
          </p>
        </div>
        <PricingDialog eligiblePlans={eligiblePlans} />
      </DialogContent>
    </Dialog>
  );
};

export const SubscriptionStatus = () => {
  const { hasActiveSubscription, getRemainingDays, profile } = useProfile();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  if (!hasActiveSubscription()) {
    return (
      <>
        <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-sm">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="max-w-7xl max-h-[95vh] overflow-y-auto p-6"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
            }}
          >
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
            </DialogHeader>
            <div className="mb-6">
              <p className="text-muted-foreground text-center">
                Unlock premium features and accelerate your career growth with our subscription plans:
              </p>
            </div>
            <PricingDialog />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-green-600" />
          <span className="text-green-600">{getRemainingDays()} days remaining</span>
        </div>
        {profile?.subscription_plan && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManageDialogOpen(true)}
            className="text-xs h-7 px-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
          >
            {profile.subscription_plan}
          </Button>
        )}
      </div>
      <ManageSubscriptionDialog 
        open={manageDialogOpen} 
        onOpenChange={setManageDialogOpen} 
      />
    </>
  );
};

// Hook for checking subscription in components
export const useSubscription = () => {
  const { hasActiveSubscription, getRemainingDays, profile } = useProfile();

  return {
    hasActiveSubscription: hasActiveSubscription(),
    remainingDays: getRemainingDays(),
    plan: profile?.subscription_plan || null,
    requiresUpgrade: !hasActiveSubscription()
  };
};