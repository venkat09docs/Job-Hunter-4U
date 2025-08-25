import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'Verification function working',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    console.log('🔍 Verification request received:', body);
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing required payment verification parameters');
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No auth header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Auth failed');
    console.log('✅ User authenticated:', user.id);
    
    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Debug: Check if payment record exists for this user and order
    console.log('🔍 Finding payment record for order:', razorpay_order_id, 'user:', user.id);
    
    const { data: existingPayment, error: findError } = await supabaseService
      .from('payment_records')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (findError) {
      console.error('❌ Error finding payment record:', findError);
    }
    
    if (!existingPayment) {
      console.error('❌ Payment record not found in database. Order ID:', razorpay_order_id);
      
      // Debug: Show recent payments for this user
      const { data: recentPayments } = await supabaseService
        .from('payment_records')
        .select('id, razorpay_order_id, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      console.error('Recent payments for user:', recentPayments);
      
      throw new Error(`Payment record not found in database. Order ID: ${razorpay_order_id}`);
    }
    
    console.log('✅ Payment record found:', existingPayment);

    // Get Razorpay credentials
    const mode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const isLive = mode === 'live';
    
    const keySecret = isLive ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    if (!keySecret) {
      throw new Error(`Missing ${mode} mode secret key`);
    }
    console.log('🔑 Using credentials for mode:', mode);

    // Verify signature
    const body_string = razorpay_order_id + "|" + razorpay_payment_id;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body_string));
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('🔍 Generated signature:', expectedSignature);
    console.log('🔍 Received signature:', razorpay_signature);
    
    const isValidSignature = expectedSignature === razorpay_signature;
    console.log('✅ Signature validation result:', isValidSignature);
    
    if (!isValidSignature) {
      throw new Error('Invalid payment signature - verification failed');
    }

    // Update payment record
    const { data: paymentRecord, error: updateError } = await supabaseService
      .from('payment_records')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        status: 'completed',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw new Error(`Failed to update payment record: ${updateError.message}`);
    }

    console.log('✅ Payment record updated:', paymentRecord);

    // Update user subscription if payment is for a plan
    if (paymentRecord && paymentRecord.plan_name) {
      console.log('🔄 Processing subscription update for plan:', paymentRecord.plan_name);
      
      // First, get the user's current subscription status
      const { data: currentProfile, error: profileFetchError } = await supabaseService
        .from('profiles')
        .select('subscription_end_date, subscription_active, subscription_plan')
        .eq('user_id', user.id)
        .single();
      
      if (profileFetchError) {
        console.error('❌ Error fetching current profile:', profileFetchError);
      }
      
      console.log('📅 Current subscription status:', currentProfile);
      
      // Calculate the starting date for the new subscription
      let subscriptionStartDate = new Date();
      
      // If user has an active subscription with future end date, start from that date
      if (currentProfile?.subscription_active && currentProfile?.subscription_end_date) {
        const currentEndDate = new Date(currentProfile.subscription_end_date);
        const now = new Date();
        
        // If current subscription hasn't expired yet, add new days to existing end date
        if (currentEndDate > now) {
          subscriptionStartDate = currentEndDate;
          console.log('✅ Adding days to existing subscription. Current end date:', currentEndDate.toISOString());
        } else {
          console.log('⏰ Current subscription expired, starting from now');
        }
      } else {
        console.log('🆕 No active subscription, starting from now');
      }
      
      // Calculate new subscription end date by adding duration to start date
      const subscriptionEndDate = new Date(subscriptionStartDate);
      
      if (paymentRecord.plan_duration === '1 week') {
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 7);
        console.log('📅 Added 7 days to subscription');
      } else if (paymentRecord.plan_duration === '1 month') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        console.log('📅 Added 1 month to subscription');
      } else if (paymentRecord.plan_duration === '3 months') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3);
        console.log('📅 Added 3 months to subscription');
      }
      
      console.log('🎯 Final subscription dates:', {
        start: new Date().toISOString(),
        end: subscriptionEndDate.toISOString(),
        totalDaysFromNow: Math.ceil((subscriptionEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      });

      const { error: profileError } = await supabaseService
        .from('profiles')
        .update({
          subscription_plan: paymentRecord.plan_name,
          subscription_active: true,
          subscription_start_date: new Date().toISOString(), // Always set start to now for tracking purposes
          subscription_end_date: subscriptionEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        // Don't throw here as payment is already verified, just log the error
      } else {
        console.log('✅ User subscription updated');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Verification error:', error.message);
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