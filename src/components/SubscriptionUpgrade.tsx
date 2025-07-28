import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Crown } from 'lucide-react';
import PricingDialog from '@/components/PricingDialog';

interface SubscriptionUpgradeProps {
  children?: React.ReactNode;
  featureName?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const SubscriptionUpgrade = ({ 
  children, 
  featureName = "this feature",
  variant = "default",
  size = "default",
  className = ""
}: SubscriptionUpgradeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hasActiveSubscription, getRemainingDays } = useProfile();

  const hasValidSubscription = hasActiveSubscription();

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
    return children ? <>{children}</> : null;
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
        className="max-w-5xl max-h-[90vh] overflow-y-auto p-6"
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
        <PricingDialog />
      </DialogContent>
    </Dialog>
  );
};

export const SubscriptionStatus = () => {
  const { hasActiveSubscription, getRemainingDays, profile } = useProfile();

  if (!hasActiveSubscription()) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">No active subscription</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Calendar className="h-4 w-4 text-green-600" />
      <span className="text-green-600">{getRemainingDays()} days remaining</span>
      {profile?.subscription_plan && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
          {profile.subscription_plan}
        </span>
      )}
    </div>
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