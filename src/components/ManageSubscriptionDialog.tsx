import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Star, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ManageSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageSubscriptionDialog = ({ open, onOpenChange }: ManageSubscriptionDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, refreshProfile, getRemainingDays } = useProfile();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: "One Week Plan",
      price: 299,
      duration: "1 week",
      days: 7,
      description: "Quick access to all career tools",
      features: [
        "AI-powered job matching",
        "Resume builder & optimization",
        "LinkedIn automation tools", 
        "Job tracker & analytics",
        "AI career assistant",
        "Portfolio builder"
      ],
      popular: false,
      variant: "outline" as const,
      icon: Zap
    },
    {
      name: "One Month Plan",
      price: 999,
      duration: "1 month",
      days: 30,
      description: "Perfect for focused job searching",
      features: [
        "AI-powered job matching",
        "Resume builder & optimization",
        "LinkedIn automation tools", 
        "Job tracker & analytics",
        "AI career assistant",
        "Portfolio builder",
        "Priority support"
      ],
      popular: true,
      variant: "default" as const,
      icon: Crown
    },
    {
      name: "Three Month Plan",
      price: 2499,
      duration: "3 months",
      days: 90,
      description: "Comprehensive career transformation",
      features: [
        "AI-powered job matching",
        "Resume builder & optimization",
        "LinkedIn automation tools",
        "Job tracker & analytics", 
        "AI career assistant",
        "Portfolio builder",
        "Priority support",
        "1-on-1 career consultation",
        "Interview preparation tools"
      ],
      popular: false,
      variant: "secondary" as const,
      icon: Star
    }
  ];

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const calculateUpgradedEndDate = (newPlanDays: number) => {
    const remainingDays = getRemainingDays();
    const totalDays = newPlanDays + remainingDays;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + totalDays);
    return endDate.toISOString();
  };

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to upgrade your subscription",
        variant: "destructive"
      });
      return;
    }

    setLoadingPlan(plan.name);

    try {
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-create-order', {
        body: {
          amount: plan.price * 100,
          plan_name: plan.name,
          plan_duration: plan.duration
        }
      });

      if (orderError) throw orderError;

      const options = {
        key: 'rzp_test_nwmEp8mRxXVFql',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Career Hub',
        description: `Upgrade to ${plan.name}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment', {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan_name: plan.name,
                plan_duration: plan.duration,
                amount: plan.price,
                upgrade_end_date: calculateUpgradedEndDate(plan.days)
              }
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Upgrade Successful!",
              description: `You've successfully upgraded to ${plan.name}. Your remaining days have been added to the new plan.`,
            });

            // Refresh profile data and close dialog
            await refreshProfile();
            onOpenChange(false);
            
            // Refresh the page to ensure UI is updated
            setTimeout(() => {
              window.location.reload();
            }, 1000);

          } catch (error: any) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support if payment was deducted",
              variant: "destructive"
            });
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const currentPlan = plans.find(plan => plan.name === profile?.subscription_plan);
  const remainingDays = getRemainingDays();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-center">Manage Your Subscription</DialogTitle>
          {currentPlan && (
            <div className="text-center mt-2">
              <Badge variant="secondary" className="text-sm">
                Current Plan: {currentPlan.name} - {remainingDays} days remaining
              </Badge>
            </div>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === profile?.subscription_plan;
            const Icon = plan.icon;
            
            return (
              <Card 
                key={plan.name} 
                className={`relative p-6 transition-all duration-200 hover:shadow-lg ${
                  isCurrentPlan ? 'ring-2 ring-primary bg-primary/5' : ''
                } ${plan.popular ? 'border-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Your Current Plan
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-gradient-to-r from-primary/10 to-primary/20">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.duration}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isCurrentPlan ? "secondary" : plan.variant}
                  className="w-full"
                  disabled={isCurrentPlan || loadingPlan === plan.name}
                  onClick={() => handleUpgrade(plan)}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>

                {!isCurrentPlan && remainingDays > 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Your {remainingDays} remaining days will be added to this plan
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Secure payments powered by Razorpay • Cancel anytime • Instant access</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscriptionDialog;