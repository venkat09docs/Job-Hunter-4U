import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Calendar, IndianRupee, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useInstituteName } from "@/hooks/useInstituteName";
import { useRole } from "@/hooks/useRole";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { InstituteSubscriptionBadge } from "@/components/InstituteSubscriptionBadge";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  name: string;
  members: number;
  price: number;
  originalPrice: number;
  discount: number;
  duration: string;
  popular: boolean;
  features: string[];
}

const InstituteMembershipPlans = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { instituteName } = useInstituteName();
  const { isInstituteAdmin } = useRole();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutePlans();
  }, []);

  const fetchInstitutePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('plan_type', 'institute')
        .eq('is_active', true)
        .order('member_limit');

      if (error) throw error;

      const formattedPlans: Plan[] = data.map(plan => ({
        id: plan.id,
        name: plan.name,
        members: plan.member_limit || 0,
        price: plan.price_paisa / 100, // Convert paisa to rupees
        originalPrice: plan.original_price_paisa / 100,
        discount: plan.discount_per_member || 0,
        duration: `${Math.round(plan.duration_days / 30)} Months`,
        popular: plan.is_popular || false,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching institute plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

      // Create order using our edge function - send amount in paisa (multiply by 100)
      console.log('Calling razorpay-create-order with:', {
        amount: Math.round(plan.price * 100),
        plan_name: plan.name,
        plan_duration: plan.duration,
      });

      try {
        const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-create-order-simple', {
          body: {
            amount: Math.round(plan.price * 100), // Convert rupees to paisa
            plan_name: plan.name,
            plan_duration: plan.duration,
          }
        });

        console.log('Edge function response:', { orderData, orderError });

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
        name: "Rise n Shine Technologies",
        description: `${plan.name} - ${plan.members} Students Access for ${plan.duration}`,
        image: "/favicon.ico",
        handler: async function (response: any) {
          try {
            // Verify payment using our edge function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment-simple', {
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

            // Process affiliate referral if user was referred
            try {
              await supabase.functions.invoke('process-affiliate', {
                body: {
                  user_id: user?.id,
                  payment_amount: plan.price,
                  payment_id: response.razorpay_payment_id
                }
              });
            } catch (affiliateError) {
              console.error('Affiliate processing error (non-critical):', affiliateError);
              // Don't show error to user as this is non-critical
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
    } catch (error) {
      console.error('Payment function error:', error);
      toast({
        title: "Error",
        description: "Failed to process payment request. Please try again.",
        variant: "destructive"
      });
      setLoadingPlan(null);
    }
  };

  if (isInstituteAdmin) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="border-b bg-card">
            <div className="container mx-auto flex items-center justify-between p-4">
              <div>
                <h1 className="text-xl font-semibold">
                  {instituteName ? `${instituteName} - Membership Plans` : 'Institute Membership Plans'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose the perfect plan for your institute
                </p>
              </div>
              
            <div className="flex items-center gap-4">
              <InstituteSubscriptionBadge />
              <UserProfileDropdown />
            </div>
            </div>
          </div>
          
          <div className="container mx-auto p-6">
            {renderPlansContent()}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Go to Dashboard</span>
            </Link>
            <div className="text-sm text-muted-foreground">
              Institute Membership Plans
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        {renderPlansContent()}
      </div>
    </div>
  );

  function renderPlansContent() {
    return (
      <>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Institute Membership Plans
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your institute. All plans include full access to our digital career hub 
            with significant savings per student.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading subscription plans...</span>
          </div>
        ) : (
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
        )}

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
      </>
    );
  }
};

export default InstituteMembershipPlans;