import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2 } from "lucide-react";
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
  const [loading, setLoading] = useState(false);


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
      console.log('🚀 Starting Razorpay payment process...');
      console.log('Plan details:', { name: plan.name, price: plan.price, duration: plan.duration });
      
      // Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
        console.error('❌ Razorpay SDK failed to load');
        toast({
          title: "Error",
          description: "Razorpay SDK failed to load. Please check your internet connection and try again.",
          variant: "destructive"
        });
        return;
      }
      console.log('✅ Razorpay SDK loaded successfully');

      // Test the edge function first
      console.log('🧪 Testing edge function connectivity...');
      try {
        const testResponse = await fetch(`https://moirryvajzyriagqihbe.supabase.co/functions/v1/razorpay-create-order-simple`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw'
          }
        });
        const testData = await testResponse.json();
        console.log('🧪 Edge function test response:', testData);
      } catch (testError) {
        console.error('🧪 Edge function test failed:', testError);
      }

      // Create order using our edge function
      console.log('📦 Creating Razorpay order...');
      const orderPayload = {
        amount: Math.round(plan.price * 100), // Convert to paisa
        plan_name: plan.name,
        plan_duration: plan.duration,
      };
      console.log('📦 Order payload:', orderPayload);
      
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-create-order-simple', {
        body: orderPayload
      });

      console.log('📦 Supabase function response:', { data: orderData, error: orderError });

      if (orderError || !orderData) {
        console.error('❌ Order creation error:', orderError);
        toast({
          title: "Payment Order Failed",
          description: orderError?.message || "Failed to create payment order. Please try again.",
          variant: "destructive"
        });
        return;
      }
      console.log('✅ Order created successfully:', orderData);

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
      await handleRazorpayPayment();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Card className="p-4 border-primary bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary/20">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Razorpay</span>
                  <Badge variant="secondary" className="text-xs">
                    Recommended
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Secure payment solution
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-wrap gap-1 justify-end">
                {['Cards', 'UPI', 'Net Banking'].map((feature) => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

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
            Pay ₹{plan.price} with Razorpay
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