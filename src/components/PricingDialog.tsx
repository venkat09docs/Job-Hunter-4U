import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Star, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PricingDialog = () => {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: "One Week Plan",
      price: 299,
      duration: "week",
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
      duration: "month", 
      description: "Perfect for focused job searching",
      features: [
        "AI-powered job matching",
        "Resume builder & optimization",
        "LinkedIn automation tools", 
        "Job tracker & analytics",
        "AI career assistant",
        "Portfolio builder",
        "Interview preparation",
        "Priority support"
      ],
      popular: true,
      variant: "hero" as const,
      icon: Crown
    },
    {
      name: "3 Months Plan",
      price: 1999,
      duration: "3 months",
      description: "Best value for comprehensive career growth",
      features: [
        "AI-powered job matching",
        "Resume builder & optimization",
        "LinkedIn automation tools", 
        "Job tracker & analytics",
        "AI career assistant",
        "Portfolio builder",
        "Interview preparation",
        "Priority support",
        "Career coaching calls"
      ],
      popular: false,
      variant: "premium" as const,
      icon: Sparkles
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

  const storeSubscription = (plan: typeof plans[0], paymentDetails: any) => {
    const subscription = {
      plan: plan.name,
      price: plan.price,
      duration: plan.duration,
      paymentId: paymentDetails.razorpay_payment_id,
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      features: plan.features
    };
    
    localStorage.setItem('jobhunter_subscription', JSON.stringify(subscription));
    localStorage.setItem('jobhunter_user_plan', plan.name);
  };

  const handlePayment = async (plan: typeof plans[0]) => {
    setLoadingPlan(plan.name);
    
    try {
      const res = await loadRazorpay();
      if (!res) {
        toast({
          title: "Error",
          description: "Razorpay SDK failed to load. Please check your internet connection and try again.",
          variant: "destructive"
        });
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_1234567890",
        amount: plan.price * 100,
        currency: "INR",
        name: "JobHunter Pro",
        description: `${plan.name} Plan - Unlock your career potential`,
        image: "/favicon.ico",
        handler: function (response: any) {
          try {
            storeSubscription(plan, response);
            
            toast({
              title: "🎉 Payment Successful!",
              description: `Welcome to ${plan.name} plan! Your subscription is now active.`,
            });
            
            setTimeout(() => {
              window.location.reload();
            }, 2000);
            
          } catch (error) {
            console.error('Error storing subscription:', error);
            toast({
              title: "Payment Received",
              description: "Payment successful, but there was an issue activating your plan. Please contact support.",
              variant: "destructive"
            });
          }
        },
        modal: {
          ondismiss: function() {
            setLoadingPlan(null);
            toast({
              title: "Payment Cancelled",
              description: "You can complete your payment anytime to activate your plan.",
            });
          }
        },
        theme: {
          color: "#6366f1"
        },
        prefill: {
          name: "",
          email: "", 
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
      
      paymentObject.open();
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
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
                    <span className="text-3xl font-bold">{plan.price.toLocaleString()}</span>
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