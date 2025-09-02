
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
    console.log('=== Razorpay Verify Payment Started ===');
    
    // Parse request
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    console.log('Verification request:', { razorpay_order_id, razorpay_payment_id });

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
      throw new Error('Authentication failed');
    }

    const user = userData.user;
    console.log('User authenticated:', user.email);

    // Get Razorpay secret for signature verification
    const razorpayMode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const isLiveMode = razorpayMode === 'live';
    
    const razorpayKeySecret = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') 
      : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret key not configured');
    }

    // Verify signature
    console.log('Verifying signature...');
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid signature');
    }

    console.log('Signature verified successfully');

    // Use service role to update payment
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
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
      throw new Error('Payment record not found');
    }

    console.log('Payment record found:', paymentRecord.id);

    // Update payment record
    console.log('Updating payment record...');
    const { error: updateError } = await supabaseService
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'completed',
        updated_at: new Date().toISOString()
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
    
    // Update user profile with subscription
    const { error: profileError } = await supabaseService
      .from('profiles')
      .update({
        subscription_plan: paymentRecord.plan_name,
        subscription_start_date: subscriptionStartDate,
        subscription_end_date: subscriptionEndDate,
        subscription_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      throw new Error('Failed to update user subscription');
    }

    console.log('User subscription updated successfully');

    // Auto-assign to RNS Tech Institute for long-term subscriptions
    const longTermPlans = ['3 months', '6 months', '1 year'];
    if (longTermPlans.includes(planDuration)) {
      console.log('Auto-assigning user to RNS Tech Institute for long-term subscription:', planDuration);
      
      const rnsInstituteId = '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80'; // RNS Tech Institute ID
      
      // Check if user is already assigned to any institute
      const { data: existingAssignment } = await supabaseService
        .from('user_assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (!existingAssignment || existingAssignment.length === 0) {
        // Auto-assign to RNS Tech Institute
        const { error: assignmentError } = await supabaseService
          .from('user_assignments')
          .insert({
            user_id: user.id,
            institute_id: rnsInstituteId,
            assignment_type: 'auto_premium',
            is_active: true
          });

        if (assignmentError) {
          console.error('Failed to auto-assign user to RNS Tech Institute:', assignmentError);
        } else {
          console.log('User successfully auto-assigned to RNS Tech Institute');
        }
      } else {
        console.log('User already has institute assignment, skipping auto-assignment');
      }
    }

    console.log('=== Payment Verification Success ===');

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
    console.error('=== Payment Verification Error ===');
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
