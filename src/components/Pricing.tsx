import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Star, Loader2 } from "lucide-react";
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

const Pricing = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshProfile, refreshAnalytics } = useProfile();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: "One Week Plan",
      price: 499,
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
      variant: "outline" as const
    },
    {
      name: "One Month Plan",
      price: 999,
      duration: "1 month",
      description: "Perfect for focused job searching",
      features: [
        "Everything in 1 Week Plan +"
      ],
      bonuses: [
        "1-time personal review of Resume, LinkedIn and GitHub Profile"
      ],
      popular: false,
      variant: "outline" as const
    },
    {
      name: "3 Months Plan",
      price: 2499,
      duration: "3 months",
      description: "Best value for comprehensive career growth",
      features: [
        "Everything in 1 Month Plan +"
      ],
      bonuses: [
        "Free Access to Career Growth Live Cohort on every Saturday",
        "1 Mock Interview in the 3rd Month"
      ],
      popular: false,
      variant: "outline" as const
    },
    {
      name: "1 Year Plan",
      price: 11999,
      duration: "1 year",
      description: "Complete career transformation package",
      features: [
        "Everything in 3 Months Plan +"
      ],
      bonuses: [
        "Video Based Bio Links",
        "Digital Profile",
        "100+ Job Applications per month",
        "Automated Job-Hunting Process"
      ],
      popular: true,
      variant: "hero" as const
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
      // Store the selected plan in sessionStorage to show after login
      sessionStorage.setItem('selectedPlan', JSON.stringify(plan));
      // Navigate to auth page instead of showing error
      window.location.href = '/auth';
      return;
    }

    setLoadingPlan(plan.name);
    
    try {
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
        toast({
          title: "Error",
          description: "Failed to create payment order. Please try again.",
          variant: "destructive"
        });
        setLoadingPlan(null);
        return;
      }

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
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });

            if (verifyError || !verifyData?.success) {
              toast({
                title: "Payment Verification Failed",
                description: "Payment received but verification failed. Please contact support.",
                variant: "destructive"
              });
              return;
            }

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
          description: `${response.error.description}. Please try again.`,
          variant: "destructive"
        });
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
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-20">
      <div className="container px-4">
        {/* Header with FOMO */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
            ⚠️ Price increases to ₹1,999 after 100 more signups
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold">
            Stop Competing. Start{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Dominating
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            While others send 100+ applications and get ghosted, our users get hired with 40% salary increases. 
            <strong className="text-foreground">Your competition is already using AI. Don't get left behind.</strong>
          </p>
          
          <div className="bg-gradient-card rounded-lg p-6 max-w-md mx-auto border border-primary/20">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">LIMITED TIME</div>
              <div className="text-sm text-muted-foreground">70% OFF - Ends Soon</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg line-through text-muted-foreground">₹1,999</span>
                <span className="text-3xl font-bold text-success">₹499</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
                    <span className="text-4xl font-bold">{plan.price.toFixed(2)}</span>
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

                {/* Bonuses (only for 1 Year Plan) */}
                {'bonuses' in plan && plan.bonuses && (
                  <div className="space-y-3 pt-2 border-t border-primary/20">
                    <div className="text-sm font-medium text-primary text-center">
                      🎁 EXCLUSIVE BONUSES
                    </div>
                    {plan.bonuses.map((bonus, bonusIndex) => (
                      <div key={bonusIndex} className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-warning flex-shrink-0" />
                        <span className="text-sm font-medium text-warning">{bonus}</span>
                      </div>
                    ))}
                  </div>
                )}

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

        {/* Social proof and urgency */}
        <div className="mt-16 text-center space-y-8">
          <div className="bg-gradient-card rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold mb-6">Why JobHunter Pro Users Get Hired Faster</h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-success">94%</div>
                <div className="text-sm text-muted-foreground">Resume ATS Pass Rate</div>
                <div className="text-xs text-muted-foreground">(vs 23% industry avg)</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">20+</div>
                <div className="text-sm text-muted-foreground">AI Agents</div>
                <div className="text-xs text-muted-foreground">(5x Boost your Job Search)</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-warning">Live Job Board</div>
                <div className="text-sm text-muted-foreground">Matching to Your Profile</div>
                <div className="text-xs text-muted-foreground">(40% above market)</div>
              </div>
            </div>
            
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-warning font-medium">
                🔥 Flash Sale: Next 50 customers get lifetime access to all future features at current price
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Perfect for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">Students</span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">Fresh Graduates</span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">Career Switchers</span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">Experienced Professionals</span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">Remote Job Seekers</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Pricing;