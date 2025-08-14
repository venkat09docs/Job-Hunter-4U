import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Star, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PricingDialog = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshProfile, refreshAnalytics } = useProfile();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: "One Week Plan",
      price: 699,
      duration: "1 week",
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
      description: "Best value for comprehensive career growth",
      features: [
        "Everything in 1 Month Plan +"
      ],
      bonuses: [
        "Free Access to Career Growth Live Cohort on every Saturday",
        "1 Live personal Mock Interview",
        "Free - Linux, Shell and AWS Courses"
      ],
      popular: true,
      variant: "hero" as const,
      icon: Sparkles
    },
    {
      name: "6 Months Plan",
      price: 6999,
      duration: "6 months",
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
      popular: false,
      variant: "outline" as const,
      icon: Crown
    },
    {
      name: "1 Year Plan",
      price: 11999,
      duration: "1 year",
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

  const handlePayment = async (plan: typeof plans[0]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to purchase a subscription plan.",
        variant: "destructive"
      });
      return;
    }

    setLoadingPlan(plan.name);
    
    try {
      // Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
        toast({
          title: "Error",
          description: "Razorpay SDK failed to load. Please check your internet connection and try again.",
          variant: "destructive"
        });
        setLoadingPlan(null);
        return;
      }

      // Create order using our edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-create-order', {
        body: {
          amount: plan.price,
          plan_name: plan.name,
          plan_duration: plan.duration,
        }
      });

      if (orderError || !orderData) {
        console.error('Order creation error:', orderError);
        toast({
          title: "Error",
          description: "Failed to create payment order. Please try again.",
          variant: "destructive"
        });
        setLoadingPlan(null);
        return;
      }

      // Configure Razorpay options
      const options = {
        key: orderData.key,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "JobHunter Pro",
        description: `${plan.name} - Unlock your career potential`,
        image: "/favicon.ico",
        handler: async function (response: any) {
          try {
            // Verify payment using our edge function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
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
            await refreshAnalytics();
            
            toast({
              title: "🎉 Payment Successful!",
              description: `Welcome to ${plan.name}! Your subscription is now active.`,
            });
            
            // Remove body class when successful
            document.body.classList.remove('razorpay-open');
            
            // Refresh the page to show updated subscription status
            setTimeout(() => {
              window.location.reload();
            }, 1500);
            
          } catch (error) {
            console.error('Error processing payment:', error);
            toast({
              title: "Payment Processing Error",
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
              title: "Payment Cancelled",
              description: "You can complete your payment anytime to activate your plan.",
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
          duration: plan.duration
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <h3 className="text-2xl font-bold">
          Choose Your{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Career Plan
          </span>
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Unlock all premium features and accelerate your job search success.
        </p>
      </div>

      {/* Pricing cards - Compact grid for dialog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {plans.map((plan, index) => {
          const IconComponent = plan.icon;
          return (
            <Card 
              key={index} 
              className={`relative p-6 bg-gradient-card border transition-all duration-300 hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-primary border-primary' : 'border-border'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <div className="space-y-4">
                {/* Plan header */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center mb-2">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <span className="text-3xl font-bold">{plan.price.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">/{plan.duration}</span>
                  </div>
                </div>

                {/* Features - Compact list */}
                <div className="space-y-2">
                  {plan.features.slice(0, 6).map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 6 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{plan.features.length - 6} more features
                    </div>
                  )}
                </div>

                {/* Bonuses (for plans that have them) */}
                {'bonuses' in plan && plan.bonuses && (
                  <div className="space-y-2 pt-2 border-t border-primary/20">
                    <div className="text-xs font-medium text-primary text-center">
                      🎁 EXCLUSIVE BONUSES
                    </div>
                    {plan.bonuses.map((bonus, bonusIndex) => (
                      <div key={bonusIndex} className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-warning">{bonus}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA button */}
                <Button 
                  variant={plan.variant}
                  size="sm" 
                  className="w-full"
                  onClick={() => handlePayment(plan)}
                  disabled={loadingPlan === plan.name}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <IconComponent className="w-4 h-4 mr-2" />
                      Get Started
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Trust indicators */}
      <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3 text-success" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3 text-success" />
          <span>Instant Access</span>
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3 text-success" />
          <span>Cancel Anytime</span>
        </div>
      </div>
    </div>
  );
};

export default PricingDialog;