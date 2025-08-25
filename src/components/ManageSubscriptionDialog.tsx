import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Star, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import PaymentGatewaySelector from './PaymentGatewaySelector';

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
  const { user } = useAuth();
  const { profile, refreshProfile, getRemainingDays } = useProfile();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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

  const handleSelectPlan = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    setSelectedPlan(null);
    onOpenChange(false);
    // Refresh the page to show updated subscription status
    setTimeout(() => {
      window.location.reload();
    }, 1500);
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
                    variant={plan.popular ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <Icon className="h-4 w-4 mr-2" />
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

        {/* Payment Gateway Selection Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                Upgrade Your Subscription
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
                    <div className="text-xs text-muted-foreground mt-1">
                      + {getRemainingDays()} days from current plan
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

        <div className="flex-shrink-0 mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>Secure payments powered by Razorpay • Cancel anytime • Instant access</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscriptionDialog;