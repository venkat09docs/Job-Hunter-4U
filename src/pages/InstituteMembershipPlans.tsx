import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Calendar, IndianRupee, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const plans = [
  {
    id: "50-members",
    name: "50 Members Pack",
    members: 50,
    price: 112500,
    originalPrice: 125000,
    discount: 250,
    duration: "3 Months",
    popular: false,
    features: [
      "50 Student Accounts",
      "3 Months Access",
      "Full Dashboard Access",
      "Progress Tracking",
      "Report Generation",
      "Email Support"
    ]
  },
  {
    id: "100-members",
    name: "100 Members Pack",
    members: 100,
    price: 200000,
    originalPrice: 250000,
    discount: 500,
    duration: "3 Months",
    popular: true,
    features: [
      "100 Student Accounts",
      "3 Months Access",
      "Full Dashboard Access",
      "Progress Tracking",
      "Report Generation",
      "Priority Email Support",
      "Bulk User Management"
    ]
  },
  {
    id: "200-members",
    name: "200 Members Pack",
    members: 200,
    price: 350000,
    originalPrice: 500000,
    discount: 750,
    duration: "3 Months",
    popular: false,
    features: [
      "200 Student Accounts",
      "3 Months Access",
      "Full Dashboard Access",
      "Progress Tracking",
      "Report Generation",
      "Priority Email Support",
      "Bulk User Management",
      "Custom Reports"
    ]
  },
  {
    id: "500-members",
    name: "500 Members Pack",
    members: 500,
    price: 750000,
    originalPrice: 1250000,
    discount: 1000,
    duration: "3 Months",
    popular: false,
    features: [
      "500 Student Accounts",
      "3 Months Access",
      "Full Dashboard Access",
      "Progress Tracking",
      "Report Generation",
      "24/7 Phone Support",
      "Bulk User Management",
      "Custom Reports",
      "Dedicated Account Manager"
    ]
  }
];

const InstituteMembershipPlans = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to purchase an institute membership plan.",
        variant: "destructive"
      });
      return;
    }

    setLoadingPlan(plan.id);
    
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
        name: "Institute Membership",
        description: `${plan.name} - ${plan.members} Students Access for ${plan.duration}`,
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

            // Success!
            toast({
              title: "🎉 Payment Successful!",
              description: `Welcome to ${plan.name}! Your institute membership is now active.`,
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
              description: "You can complete your payment anytime to activate your institute membership.",
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
          email: user.email || '',
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
      
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
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Institute Membership Plans
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Choose the perfect plan for your institute. All plans include full access to our digital career hub 
          with significant savings per student.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-sm">
                Perfect for institutes with {plan.members} students
              </CardDescription>
              
              <div className="mt-4">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <IndianRupee className="h-5 w-5 text-muted-foreground" />
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(plan.price).replace('₹', '')}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground line-through">
                  {formatPrice(plan.originalPrice)}
                </div>
                <Badge variant="secondary" className="mt-2">
                  Save ₹{plan.discount} per member
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-muted rounded-lg">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold">{plan.members} Members</span>
                <Calendar className="h-4 w-4 text-primary ml-2" />
                <span className="font-semibold">{plan.duration}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan)}
                disabled={loadingPlan === plan.id}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Select Plan"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-muted p-6 rounded-lg max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Need a Custom Plan?</h3>
          <p className="text-muted-foreground mb-4">
            If you have more than 500 students or need a customized solution, 
            contact our sales team for enterprise pricing.
          </p>
          <Button variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstituteMembershipPlans;