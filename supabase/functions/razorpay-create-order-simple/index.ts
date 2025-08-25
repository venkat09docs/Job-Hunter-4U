import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Add test endpoint for debugging
  if (req.method === 'GET') {
    console.log('=== RAZORPAY FUNCTION TEST ENDPOINT ===');
    const razorpayMode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const availableEnvVars = Object.keys(Deno.env.toObject()).filter(k => k.includes('RAZORPAY'));
    
    return new Response(
      JSON.stringify({
        status: 'Function is working',
        razorpay_mode: razorpayMode,
        available_env_vars: availableEnvVars,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }

  try {
    console.log('=== SIMPLE RAZORPAY ORDER CREATION STARTED ===');
    
    // Parse request body
    const body = await req.json();
    console.log('Request body:', body);
    
    const { amount, plan_name, plan_duration } = body;
    
    // Basic validation
    if (!amount || !plan_name || !plan_duration) {
      console.error('Missing required fields:', { amount, plan_name, plan_duration });
      throw new Error('Missing required fields: amount, plan_name, plan_duration');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Authentication failed');
    }

    console.log('User authenticated:', user.id);

    // Get Razorpay credentials - Check mode first with detailed logging
    const razorpayMode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const isLiveMode = razorpayMode === 'live';
    
    console.log('=== RAZORPAY CONFIGURATION ===');
    console.log('Razorpay mode:', razorpayMode);
    console.log('Is live mode:', isLiveMode);
    
    const keyId = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_ID')
      : Deno.env.get('RAZORPAY_TEST_KEY_ID');
    const keySecret = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') 
      : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    console.log('Key ID exists:', !!keyId);
    console.log('Key Secret exists:', !!keySecret);
    console.log('Key ID prefix:', keyId ? keyId.substring(0, 10) + '...' : 'NOT SET');
    
    if (!keyId || !keySecret) {
      console.error('Missing Razorpay credentials for mode:', razorpayMode);
      console.error('Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('RAZORPAY')));
      throw new Error(`Razorpay credentials not configured for ${razorpayMode} mode`);
    }

    console.log('Creating Razorpay order with amount:', amount);

    // Create Razorpay order
    const orderPayload = {
      amount: amount, // Already in paisa from frontend
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        plan_name,
        plan_duration,
        user_id: user.id
      }
    };

    console.log('Razorpay order payload:', orderPayload);

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    console.log('Razorpay response status:', razorpayResponse.status);

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay error:', errorText);
      throw new Error(`Razorpay API error: ${errorText}`);
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('Razorpay order created:', razorpayOrder.id);

    // Create payment record using service role client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Creating payment record in database...');
    console.log('Payment details:', {
      user_id: user.id,
      order_id: razorpayOrder.id,
      amount: parseInt(amount),
      plan_name: plan_name,
      plan_duration: plan_duration
    });
    
    // Use the dedicated database function to create payment record
    const { data: paymentData, error: insertError } = await supabaseService
      .rpc('create_payment_record', {
        p_user_id: user.id,
        p_razorpay_order_id: razorpayOrder.id,
        p_amount: parseInt(amount),
        p_plan_name: plan_name,
        p_plan_duration: plan_duration
      });

    console.log('Database function response:', { data: paymentData, error: insertError });

    if (insertError) {
      console.error('CRITICAL: Database function error:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      throw new Error(`Failed to create payment record: ${insertError.message || 'Database error'}. Please try again.`);
    } else {
      console.log('✅ Payment record created successfully with ID:', paymentData);
    }

    // Return success response
    const responseData = {
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: keyId,
    };

    console.log('=== SUCCESS ===', responseData);

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('=== SIMPLE ORDER CREATION FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
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