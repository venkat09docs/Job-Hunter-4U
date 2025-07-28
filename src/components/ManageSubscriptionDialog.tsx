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

        <div className="flex gap-6 mt-8 overflow-x-auto pb-4">{/* Single row layout */}
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === profile?.subscription_plan;
            const Icon = plan.icon;
            
            return (
              <Card 
                key={plan.name} 
                className={`relative p-8 bg-gradient-card border-0 shadow-elegant hover:shadow-glow transition-all duration-300 transform hover:scale-105 min-w-[320px] flex-shrink-0 ${
                  isCurrentPlan ? 'ring-2 ring-success ring-offset-2 scale-105 bg-success/5' : ''
                } ${plan.popular ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''}`}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-primary-foreground shadow-lg">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-success to-success-glow text-white shadow-lg">
                      <Check className="h-3 w-3 mr-1" />
                      Active Plan
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full ${
                      isCurrentPlan 
                        ? 'bg-gradient-to-r from-success/20 to-success-glow/20' 
                        : plan.popular 
                          ? 'bg-gradient-to-r from-primary/20 to-primary-glow/20'
                          : 'bg-gradient-to-r from-muted/20 to-muted/30'
                    }`}>
                      <Icon className={`h-10 w-10 ${
                        isCurrentPlan ? 'text-success' : plan.popular ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-lg text-muted-foreground">₹</span>
                      <span className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">/{plan.duration}</span>
                    </div>
                    {plan.days && !isCurrentPlan && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {plan.days} days of premium access
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                      </div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Button
                    variant={isCurrentPlan ? "secondary" : plan.variant}
                    className="w-full h-12 text-base font-semibold"
                    disabled={isCurrentPlan || loadingPlan === plan.name}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <Crown className="h-5 w-5 mr-2" />
                        Upgrade to {plan.name}
                      </>
                    )}
                  </Button>

                  {!isCurrentPlan && remainingDays > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-center text-muted-foreground">
                        <span className="font-medium text-primary">{remainingDays} remaining days</span> from your current plan will be added to this upgrade
                      </p>
                    </div>
                  )}
                </div>
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