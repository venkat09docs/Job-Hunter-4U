import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Pricing = () => {
  const { toast } = useToast();

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

  const handlePayment = async (plan: typeof plans[0]) => {
    const res = await loadRazorpay();
    if (!res) {
      toast({
        title: "Error",
        description: "Razorpay SDK failed to load. Please try again.",
        variant: "destructive"
      });
      return;
    }

    const options = {
      key: "rzp_test_1234567890", // Replace with your Razorpay key
      amount: plan.price * 100, // Razorpay expects amount in paise
      currency: "INR",
      name: "JobHunter Pro",
      description: `${plan.name} Plan Subscription`,
      image: "/favicon.ico",
      handler: function (response: any) {
        toast({
          title: "Payment Successful!",
          description: `Welcome to ${plan.name} plan! Payment ID: ${response.razorpay_payment_id}`,
        });
        console.log("Payment successful:", response);
      },
      prefill: {
        name: "",
        email: "",
        contact: ""
      },
      notes: {
        plan: plan.name,
        duration: plan.duration
      },
      theme: {
        color: "#6366f1"
      },
      modal: {
        ondismiss: function() {
          console.log('Payment modal closed');
        }
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
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
                >
                  {plan.popular && <Zap className="w-4 h-4 mr-2" />}
                  {plan.name === "Premium" && <Crown className="w-4 h-4 mr-2" />}
                  Get Started
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