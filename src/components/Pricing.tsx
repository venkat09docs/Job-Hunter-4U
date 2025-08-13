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
      popular: true,
      variant: "hero" as const
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
      popular: false,
      variant: "outline" as const
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
    <section id="pricing" className="section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">⚠️ Price increases to ₹1,999 after 100 more signups</div>
          <h2 className="h2">
            Stop Competing. Start{" "}
            <span style={{ color: 'var(--brand)' }}>
              Dominating
            </span>
          </h2>
          <p className="lead">
            While others send 100+ applications and get ghosted, our users get hired with 40% salary increases. 
            <strong>Your competition is already using AI. Don't get left behind.</strong>
          </p>
          
          <div className="card p24 mt24" style={{ maxWidth: '400px', margin: '24px auto 0', background: 'linear-gradient(135deg, rgba(108,139,255,.05), rgba(91,231,196,.03))' }}>
            <div className="center">
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand)' }}>LIMITED TIME</div>
              <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>70% OFF - Ends Soon</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '18px', textDecoration: 'line-through', color: 'var(--muted)' }}>₹1,999</span>
                <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)' }}>₹499</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="pricing">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`plan card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && (
                <div className="plan-badge">
                  ⭐ Most Popular
                </div>
              )}
              
              {/* Plan Header */}
              <div className="center">
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>{plan.name}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0' }}>{plan.description}</p>
              </div>

              {/* Price */}
              <div className="center">
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--muted)' }}>₹</span>
                  <span className="price">{plan.price.toFixed(2)}</span>
                  <span className="period">/{plan.duration}</span>
                </div>
              </div>

              {/* Features */}
              <ul>
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex}>{feature}</li>
                ))}
              </ul>

              {/* Bonuses */}
              {'bonuses' in plan && plan.bonuses && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(108,139,255,.2)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--brand)', textAlign: 'center', marginBottom: '12px' }}>
                    🎁 EXCLUSIVE BONUSES
                  </div>
                  <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'grid', gap: '8px' }}>
                    {plan.bonuses.map((bonus, bonusIndex) => (
                      <li key={bonusIndex} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--warning)' }}>
                        <span>⭐</span>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{bonus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <button 
                className="button cta"
                onClick={() => handlePayment(plan)}
                disabled={loadingPlan === plan.name}
                style={{ width: '100%', marginTop: 'auto' }}
              >
                {loadingPlan === plan.name ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {plan.popular && <Zap className="w-4 h-4" />}
                    Get Started
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="card p32 mt24" style={{ background: 'linear-gradient(135deg, rgba(108,139,255,.04), rgba(91,231,196,.02))' }}>
          <h3 className="h2 center">Why JobHunter Pro Users Get Hired Faster</h3>
          
          <div className="boards mt24">
            <div className="board center">
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)' }}>94%</div>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Resume ATS Pass Rate</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>(vs 23% industry avg)</div>
            </div>
            <div className="board center">
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--brand)' }}>20+</div>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>AI Agents</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>(5x Boost your Job Search)</div>
            </div>
            <div className="board center">
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--warning)' }}>Live Job Board</div>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Matching to Your Profile</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>(40% above market)</div>
            </div>
          </div>
          
          <div className="card p16 mt16" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))', border: '1px solid rgba(245, 158, 11, 0.12)' }}>
            <p style={{ color: 'var(--warning)', fontWeight: '500', fontSize: '14px', margin: '0', textAlign: 'center' }}>
              🔥 Flash Sale: Next 50 customers get lifetime access to all future features at current price
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;