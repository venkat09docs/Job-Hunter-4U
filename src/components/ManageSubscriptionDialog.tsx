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
      price: 699,
      duration: "1 week",
      days: 7,
      description: "Quick access to all career tools",
      features: [
        "AI-powered job matching",
        "Resume builder & optimization",
        "LinkedIn optimization", 
        "Job tracker & analytics",
        "AI career assistant",
        "Portfolio builder",
        "Interview preparation",
        "All premium features included"
      ],
      popular: false,
      variant: "outline" as const,
      icon: Zap
    },
    {
      name: "One Month Plan",
      price: 1499,
      duration: "1 month",
      days: 30,
      description: "Perfect for focused job searching",
      features: [
        "Everything in 1 Week Plan +"
      ],
      bonuses: [
        "1-time personal review of Resume, LinkedIn and GitHub Profile"
      ],
      popular: false,
      variant: "outline" as const,
      icon: Crown
    },
    {
      name: "3 Months Plan",
      price: 3999,
      duration: "3 months",
      days: 90,
      description: "Best value for comprehensive career growth",
      features: [
        "Everything in 1 Month Plan +"
      ],
      bonuses: [
        "Free Access to Career Growth Live Cohort on every Saturday",
        "1 Live personal Mock Interview",
        "Free - Linux, Shell and AWS Courses"
      ],
      popular: false,
      variant: "outline" as const,
      icon: Star
    },
    {
      name: "6 Months Plan",
      price: 6999,
      duration: "6 months",
      days: 180,
      description: "Extended career development package",
      features: [
        "Everything in 3 Months Plan +"
      ],
      bonuses: [
        "Video Based Bio Links",
        "Digital Profile",
        "100+ Job Applications per month",
        "Free - DevOps with AWS and Python Course"
      ],
      popular: true,
      variant: "default" as const,
      icon: Crown
    },
    {
      name: "1 Year Plan",
      price: 11999,
      duration: "1 year",
      days: 365,
      description: "Complete career transformation package",
      features: [
        "Everything in 6 Months Plan +"
      ],
      bonuses: [
        "AI Automation Bootcamp",
        "Vibe Coding Tools [No coding required]",
        "Automated Job-Hunting Process"
      ],
      popular: false,
      variant: "outline" as const,
      icon: Crown
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
    return endDate;
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

    // Check if user session is still valid before making the payment request
    try {
      console.log('Checking user session before payment...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast({
          title: "Session Error",
          description: "There was an error checking your session. Please refresh the page and login again.",
          variant: "destructive"
        });
        return;
      }
      
      if (!session || !session.user) {
        console.error('No valid session found');
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please refresh the page and login again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ Session is valid, proceeding with payment...');
    } catch (error) {
      console.error('Session validation error:', error);
      toast({
        title: "Authentication Error",
        description: "Unable to verify your session. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    setLoadingPlan(plan.name);
    
    
    try {
      // Load Razorpay SDK
      console.log('Loading Razorpay SDK...');
      const res = await loadRazorpay();
      if (!res) {
        console.error('Razorpay SDK failed to load');
        toast({
          title: "Error",
          description: "Razorpay SDK failed to load. Please check your internet connection and try again.",
          variant: "destructive"
        });
        setLoadingPlan(null);
        return;
      }
      console.log('✅ Razorpay SDK loaded successfully');

      // Create order using our edge function
      console.log('Creating payment order...', { amount: plan.price, plan_name: plan.name });
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-create-order', {
        body: {
          amount: plan.price,
          plan_name: plan.name,
          plan_duration: plan.duration,
        }
      });

      if (orderError) {
        console.error('Order creation error:', orderError);
        toast({
          title: "Payment Order Failed",
          description: `Failed to create payment order: ${orderError.message}. Please try refreshing the page and logging in again.`,
          variant: "destructive"
        });
        setLoadingPlan(null);
        return;
      }

      if (!orderData) {
        console.error('No order data returned');
        toast({
          title: "Error",
          description: "No payment order data received. Please try again.",
          variant: "destructive"
        });
        setLoadingPlan(null);
        return;
      }

      console.log('✅ Payment order created successfully:', orderData);

      // Calculate upgraded end date
      const upgradedEndDate = calculateUpgradedEndDate(plan.days);

      // Configure Razorpay options
      const options = {
        key: orderData.key,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "JobHunter Pro",
        description: `${plan.name} - Upgrade your subscription`,
        image: "/favicon.ico",
        handler: async function (response: any) {
          try {
            // Verify payment using our edge function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                upgrade_end_date: upgradedEndDate.toISOString()
              }
            });

            if (verifyError || !verifyData?.success) {
              console.error('Payment verification error:', verifyError);
              toast({
                title: "Payment Verification Failed",
                description: "Payment received but verification failed. Please contact support.",
                variant: "destructive"
              });
              return;
            }

            // Success! Refresh profile data
            await refreshProfile();
            
            toast({
              title: "🎉 Upgrade Successful!",
              description: `Welcome to ${plan.name}! Your subscription has been upgraded.`,
            });
            
            // Remove body class when successful
            document.body.classList.remove('razorpay-open');
            
            // Close dialog and reload
            onOpenChange(false);
            setTimeout(() => {
              window.location.reload();
            }, 1500);
            
          } catch (error) {
            console.error('Error processing upgrade:', error);
            toast({
              title: "Upgrade Processing Error",
              description: "Payment may have been successful but activation failed. Please contact support.",
              variant: "destructive"
            });
          }
        },
        modal: {
          ondismiss: function() {
            setLoadingPlan(null);
            document.body.classList.remove('razorpay-open');
            toast({
              title: "Upgrade Cancelled",
              description: "You can complete your upgrade anytime.",
            });
          },
          escape: true,
          backdropclose: false
        },
        theme: {
          color: "#6366f1",
          backdrop_color: "rgba(0, 0, 0, 0.8)"
        },
        prefill: {
          name: user.user_metadata?.full_name || "",
          email: user.email || "", 
          contact: ""
        },
        notes: {
          plan: plan.name,
          duration: plan.duration,
          upgrade: true
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        setLoadingPlan(null);
        toast({
          title: "Payment Failed",
          description: `${response.error.description}. Please try again or contact support.`,
          variant: "destructive"
        });
        console.error('Payment failed:', response.error);
      });
      
      // Blur any currently focused element
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      
      // Open payment modal first
      paymentObject.open();
      
      // Add class to body after modal opens to avoid affecting Razorpay
      setTimeout(() => {
        document.body.classList.add('razorpay-open');
      }, 100);
      
      // Simple focus management - just ensure window focus
      setTimeout(() => {
        window.focus();
      }, 300);
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
      setLoadingPlan(null);
    }
  };

  const currentPlan = plans.find(plan => plan.name === profile?.subscription_plan);
  const remainingDays = getRemainingDays();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col cursor-default">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-2xl font-bold text-center">Manage Your Subscription</DialogTitle>
          {currentPlan && (
            <div className="text-center mt-2">
              <Badge variant="secondary" className="text-sm">
                Current Plan: {currentPlan.name} - {remainingDays} days remaining
              </Badge>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 px-2">{/* Four column grid layout */}
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === profile?.subscription_plan;
            const Icon = plan.icon;
            
            return (
              <Card 
                key={plan.name} 
                className={`relative p-4 bg-gradient-card border-0 shadow-elegant hover:shadow-glow transition-all duration-300 transform hover:scale-105 flex-1 ${
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

                <div className="text-center mb-4">
                  <div className="flex justify-center mb-2">
                    <div className={`p-2 rounded-full ${
                      isCurrentPlan 
                        ? 'bg-gradient-to-r from-success/20 to-success-glow/20' 
                        : plan.popular 
                          ? 'bg-gradient-to-r from-primary/20 to-primary-glow/20'
                          : 'bg-gradient-to-r from-muted/20 to-muted/30'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        isCurrentPlan ? 'text-success' : plan.popular ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-xs mb-3">{plan.description}</p>
                  <div className="mb-3">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm text-muted-foreground">₹</span>
                      <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">/{plan.duration}</span>
                    </div>
                    {plan.days && !isCurrentPlan && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.days} days access
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <Check className="h-3 w-3 text-success flex-shrink-0" />
                      </div>
                      <span className="text-xs leading-relaxed">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{plan.features.length - 4} more features
                    </p>
                  )}
                </div>

                {/* Bonuses (for plans that have them) */}
                {'bonuses' in plan && plan.bonuses && (
                  <div className="space-y-1 mb-4 pt-2 border-t border-primary/20">
                    <div className="text-xs font-medium text-primary text-center">
                      🎁 EXCLUSIVE BONUSES
                    </div>
                    {plan.bonuses.map((bonus, bonusIndex) => (
                      <div key={bonusIndex} className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <Star className="h-3 w-3 text-warning flex-shrink-0" />
                        </div>
                        <span className="text-xs font-medium text-warning leading-relaxed">{bonus}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    variant={isCurrentPlan ? "secondary" : plan.variant}
                    className="w-full h-8 text-xs font-semibold"
                    disabled={isCurrentPlan || loadingPlan === plan.name}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing Payment...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <Crown className="h-3 w-3 mr-1" />
                        Upgrade to {plan.name}
                      </>
                    )}
                  </Button>

                  {!isCurrentPlan && remainingDays > 0 && (
                    <div className="bg-muted/50 rounded-lg p-1.5">
                      <p className="text-xs text-center text-muted-foreground">
                        <span className="font-medium text-primary">{remainingDays} days</span> added
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          </div>
        </div>

        <div className="flex-shrink-0 mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>Secure payments powered by Razorpay • Cancel anytime • Instant access</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscriptionDialog;