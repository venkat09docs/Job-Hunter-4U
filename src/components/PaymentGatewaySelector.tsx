import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  name: string;
  price: number;
  duration: string;
  description: string;
  features: string[];
  bonuses?: string[];
  popular?: boolean;
  variant: "default" | "outline" | "hero";
  icon: any;
}

interface PaymentGatewaySelectorProps {
  plan: Plan;
  onSuccess?: () => void;
  disabled?: boolean;
}

const PaymentGatewaySelector = ({ plan, onSuccess, disabled = false }: PaymentGatewaySelectorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshProfile, refreshAnalytics } = useProfile();
  const [selectedGateway, setSelectedGateway] = useState<'razorpay' | 'instamojo'>('instamojo');
  const [loading, setLoading] = useState(false);

  const gateways = [
    {
      id: 'instamojo' as const,
      name: 'Instamojo',
      description: 'Trusted Indian payment gateway',
      icon: Smartphone,
      popular: true,
      features: ['UPI', 'Cards', 'Net Banking', 'Wallets']
    },
    {
      id: 'razorpay' as const,
      name: 'Razorpay',
      description: 'Popular payment solution',
      icon: CreditCard,
      popular: false,
      features: ['Cards', 'UPI', 'Net Banking', 'EMI']
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

  const handleRazorpayPayment = async () => {
    try {
      // Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
        toast({
          title: "Error",
          description: "Razorpay SDK failed to load. Please check your internet connection and try again.",
          variant: "destructive"
        });
        return;
      }

      // Create order using our edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-create-order-simple', {
        body: {
          amount: Math.round(plan.price * 100), // Convert to paisa
          plan_name: plan.name,
          plan_duration: plan.duration,
        }
      });

      if (orderError || !orderData) {
        console.error('Order creation error:', orderError);
        toast({
          title: "Payment Order Failed",
          description: orderError?.message || "Failed to create payment order. Please try again.",
          variant: "destructive"
        });
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
            // Verify payment
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

            // Success!
            await refreshProfile();
            await refreshAnalytics();
            
            toast({
              title: "🎉 Payment Successful!",
              description: `Welcome to ${plan.name}! Your subscription is now active.`,
            });

            onSuccess?.();
            
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
          name: user?.user_metadata?.full_name || "",
          email: user?.email || ""
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast({
        title: "Error",
        description: "Failed to initialize Razorpay payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInstamojoPayment = async () => {
    try {
      // First test basic function call
      console.log('Testing basic Instamojo function...');
      const { data: testData, error: testError } = await supabase.functions.invoke('test-instamojo', {
        body: { test: true }
      });

      console.log('Test function result:', { testData, testError });

      if (testError) {
        toast({
          title: "Function Test Failed",
          description: `Test error: ${testError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Create order using Instamojo edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('instamojo-create-order', {
        body: {
          amount: Math.round(plan.price * 100), // Convert to paisa for consistency
          plan_name: plan.name,
          plan_duration: plan.duration,
        }
      });

      if (orderError || !orderData) {
        console.error('Instamojo order creation error:', orderError);
        toast({
          title: "Payment Order Failed",
          description: orderError?.message || "Failed to create payment order. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Redirect to Instamojo payment page
      window.location.href = orderData.payment_url;
      
    } catch (error) {
      console.error('Instamojo payment error:', error);
      toast({
        title: "Error",
        description: "Failed to initialize Instamojo payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to purchase a subscription plan.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      if (selectedGateway === 'razorpay') {
        await handleRazorpayPayment();
      } else {
        await handleInstamojoPayment();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground mb-3">
        Choose Payment Method
      </div>
      
      <RadioGroup 
        value={selectedGateway} 
        onValueChange={(value) => setSelectedGateway(value as 'razorpay' | 'instamojo')}
        className="space-y-3"
      >
        {gateways.map((gateway) => {
          const IconComponent = gateway.icon;
          return (
            <div key={gateway.id}>
              <Label 
                htmlFor={gateway.id}
                className="cursor-pointer"
              >
                <Card className={`p-4 transition-all duration-200 hover:shadow-md ${
                  selectedGateway === gateway.id 
                    ? 'ring-2 ring-primary border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={gateway.id} id={gateway.id} />
                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          selectedGateway === gateway.id 
                            ? 'bg-primary/20' 
                            : 'bg-muted'
                        }`}>
                          <IconComponent className={`h-4 w-4 ${
                            selectedGateway === gateway.id 
                              ? 'text-primary' 
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{gateway.name}</span>
                            {gateway.popular && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {gateway.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {gateway.features.slice(0, 3).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      <Button 
        onClick={handlePayment}
        disabled={loading || disabled}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Pay ₹{plan.price} with {gateways.find(g => g.id === selectedGateway)?.name}
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your payment is secured with 256-bit SSL encryption. 
        No card details are stored on our servers.
      </p>
    </div>
  );
};

export default PaymentGatewaySelector;