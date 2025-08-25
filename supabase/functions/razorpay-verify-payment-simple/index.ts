import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const planDurationMap: Record<string, number> = {
  "1 week": 7,
  "1 month": 30,
  "3 months": 90,
  "6 months": 180,
  "1 year": 365,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SIMPLE RAZORPAY VERIFICATION STARTED ===');
    
    // Parse request
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    console.log('Verification request:', { razorpay_order_id, razorpay_payment_id });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing required payment data');
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error('Auth error:', userError);
      throw new Error('Authentication failed');
    }

    const user = userData.user;
    console.log('User authenticated:', user.email);

    // Get Razorpay secret for signature verification
    const razorpayKeySecret = Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret key not configured');
    }

    // Verify signature
    console.log('Verifying signature...');
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(body)
      .digest("hex");

    console.log('Expected signature:', expectedSignature.substring(0, 10) + '...');
    console.log('Received signature:', razorpay_signature.substring(0, 10) + '...');

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch');
      throw new Error('Invalid payment signature');
    }

    console.log('✅ Signature verified successfully');

    // Use service role to update payment
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the payment record
    console.log('Finding payment record...');
    const { data: paymentRecord, error: findError } = await supabaseService
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single();

    if (findError || !paymentRecord) {
      console.error('Payment record not found:', findError);
      throw new Error('Payment record not found in database');
    }

    console.log('Payment record found:', paymentRecord.id);

    // Update payment record
    console.log('Updating payment record...');
    const { error: updateError } = await supabaseService
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'completed'
      })
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      throw new Error('Failed to update payment record');
    }

    console.log('Payment record updated successfully');

    // Calculate subscription dates
    const planDuration = paymentRecord.plan_duration;
    const daysToAdd = planDurationMap[planDuration] || 30;
    
    const now = new Date();
    const subscriptionStartDate = now.toISOString();
    const subscriptionEndDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000)).toISOString();

    console.log('Updating user subscription...');
    console.log('Plan:', paymentRecord.plan_name);
    console.log('Duration:', planDuration, '(', daysToAdd, 'days)');
    
    // Update user profile with subscription
    const { error: profileError } = await supabaseService
      .from('profiles')
      .update({
        subscription_plan: paymentRecord.plan_name,
        subscription_start_date: subscriptionStartDate,
        subscription_end_date: subscriptionEndDate,
        subscription_active: true
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      throw new Error('Failed to update user subscription');
    }

    console.log('✅ User subscription updated successfully');
    console.log('=== PAYMENT VERIFICATION SUCCESS ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified and subscription activated',
        subscription: {
          plan: paymentRecord.plan_name,
          start_date: subscriptionStartDate,
          end_date: subscriptionEndDate
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('=== PAYMENT VERIFICATION FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});