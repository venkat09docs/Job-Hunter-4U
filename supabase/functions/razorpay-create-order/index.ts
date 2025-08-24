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

  try {
    console.log('=== Razorpay Create Order Started ===');
    
    // Parse request
    const { amount, plan_name, plan_duration } = await req.json();
    console.log('Request:', { amount, plan_name, plan_duration });

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
    if (userError || !userData?.user?.email) {
      throw new Error('Authentication failed');
    }

    const user = userData.user;
    console.log('User authenticated:', user.email);

    // Get Razorpay credentials
    const razorpayMode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const isLiveMode = razorpayMode === 'live';
    
    const razorpayKeyId = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_ID')
      : Deno.env.get('RAZORPAY_TEST_KEY_ID');
    const razorpayKeySecret = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') 
      : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    console.log('Using Razorpay mode:', razorpayMode);

    // Create Razorpay order
    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);
    
    const orderData = {
      amount: amount * 100, // Convert to paisa
      currency: 'INR',
      receipt: receipt,
      notes: {
        plan_name: plan_name,
        plan_duration: plan_duration,
        user_id: user.id
      }
    };

    console.log('Creating Razorpay order...');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error:', response.status, errorText);
      throw new Error(`Razorpay API error: ${response.status}`);
    }

    const order = await response.json();
    console.log('Razorpay order created:', order.id);

    // Store payment record using service role
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Storing payment record...');
    const { data: paymentRecord, error: dbError } = await supabaseService
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: amount,
        plan_name: plan_name,
        plan_duration: plan_duration
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Payment record created:', paymentRecord.id);
    console.log('=== Order Creation Success ===');

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: razorpayKeyId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('=== Order Creation Error ===');
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});