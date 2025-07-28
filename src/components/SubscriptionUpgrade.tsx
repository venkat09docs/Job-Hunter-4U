import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Crown } from 'lucide-react';
import Pricing from '@/components/Pricing';

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

  if (hasValidSubscription) {
    return children ? <>{children}</> : null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Your Subscription</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <p className="text-muted-foreground">
            You need an active subscription to access {featureName}. Choose a plan that works for you:
          </p>
        </div>
        <Pricing />
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