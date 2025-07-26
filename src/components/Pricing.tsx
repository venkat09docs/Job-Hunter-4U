import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Pricing = () => {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: "Basic",
      price: 999,
      duration: "month",
      description: "Perfect for job seekers starting their journey",
      features: [
        "Basic job matching",
        "5 applications per month",
        "Email support",
        "Resume review",
        "Basic career tips"
      ],
      popular: false,
      variant: "outline" as const
    },
    {
      name: "Professional",
      price: 2499,
      duration: "month", 
      description: "Most popular choice for serious job hunters",
      features: [
        "Advanced AI job matching",
        "Unlimited applications",
        "Priority support",
        "Professional resume writing",
        "1-on-1 career coaching session",
        "Salary negotiation guide",
        "Industry insights",
        "Network building tools"
      ],
      popular: true,
      variant: "hero" as const
    },
    {
      name: "Premium",
      price: 4999,
      duration: "month",
      description: "Complete career transformation package",
      features: [
        "Everything in Professional",
        "Weekly 1-on-1 coaching",
        "Personal brand development",
        "LinkedIn optimization",
        "Interview preparation",
        "Direct employer connections",
        "Guaranteed interviews",
        "60-day money back guarantee"
      ],
      popular: false,
      variant: "premium" as const
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
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_1234567890", // Replace with your actual key
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
            
            // Optional: Redirect to dashboard or reload page
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
    <section className="py-20">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Choose Your{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Career Plan
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Invest in your future with our affordable plans designed to accelerate 
            your job search and career growth.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative p-8 bg-gradient-card border-0 shadow-elegant hover:shadow-glow transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <div className="space-y-6">
                {/* Plan header */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground">/{plan.duration}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA button */}
                <Button 
                  variant={plan.variant}
                  size="lg" 
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
                      {plan.popular && <Zap className="w-4 h-4 mr-2" />}
                      {plan.name === "Premium" && <Crown className="w-4 h-4 mr-2" />}
                      Get Started
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Money back guarantee */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans come with a <span className="text-success font-semibold">30-day money-back guarantee</span>. 
            Cancel anytime, no questions asked.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;