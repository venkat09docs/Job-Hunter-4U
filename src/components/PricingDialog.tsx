import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Zap, Crown, Star, Sparkles } from "lucide-react";
import { useState } from "react";
import PaymentGatewaySelector from "./PaymentGatewaySelector";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PricingDialogProps {
  eligiblePlans?: string[];
}

const PricingDialog = ({ eligiblePlans }: PricingDialogProps = {}) => {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Debug logging
  console.log('🔍 PricingDialog Debug:', {
    eligiblePlans,
    hasEligiblePlans: !!eligiblePlans,
    eligiblePlansLength: eligiblePlans?.length || 0
  });

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

  const handleSelectPlan = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    setSelectedPlan(null);
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
        {plans
          .filter(plan => {
            const shouldInclude = !eligiblePlans || eligiblePlans.includes(plan.name);
            console.log('🔍 Plan Filter Debug:', {
              planName: plan.name,
              eligiblePlans,
              shouldInclude
            });
            return shouldInclude;
          })
          .map((plan, index) => {
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
                  onClick={() => handleSelectPlan(plan)}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  Get Started
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

      {/* Payment Gateway Selection Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Complete Your Purchase
            </DialogTitle>
            {selectedPlan && (
              <div className="text-center space-y-2">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">{selectedPlan.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                  <div className="text-2xl font-bold text-primary mt-2">
                    ₹{selectedPlan.price}
                    <span className="text-sm font-normal text-muted-foreground">/{selectedPlan.duration}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogHeader>
          
          {selectedPlan && (
            <PaymentGatewaySelector 
              plan={selectedPlan}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingDialog;