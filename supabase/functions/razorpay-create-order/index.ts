import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderRequest {
  amount: number;
  plan_name: string;
  plan_duration: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== RAZORPAY CREATE ORDER START ===');
  
  try {
    // Parse request body first
    console.log('1. Parsing request body...');
    const requestBody = await req.json();
    const { amount, plan_name, plan_duration }: OrderRequest = requestBody;
    console.log('Request data:', { amount, plan_name, plan_duration });

    if (!amount || !plan_name || !plan_duration) {
      throw new Error('Missing required fields: amount, plan_name, plan_duration');
    }

    // Authenticate user
    console.log('2. Authenticating user...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData?.user?.email) {
      console.error('Auth error:', userError);
      throw new Error('Authentication failed');
    }

    const user = userData.user;
    console.log('✅ User authenticated:', user.email);

    // Get Razorpay credentials
    console.log('3. Getting Razorpay credentials...');
    const razorpayMode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const isLiveMode = razorpayMode === 'live';
    
    const razorpayKeyId = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_ID')
      : Deno.env.get('RAZORPAY_TEST_KEY_ID');
    const razorpayKeySecret = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') 
      : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error(`Razorpay ${isLiveMode ? 'live' : 'test'} credentials not configured`);
    }

    console.log('✅ Razorpay credentials found, mode:', razorpayMode);

    // Create Razorpay order
    console.log('4. Creating Razorpay order...');
    const timestamp = Date.now().toString();
    const userIdShort = user.id.slice(0, 8);
    const receipt = `rcpt_${userIdShort}_${timestamp}`.slice(0, 40);
    
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

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret.trim()}`)}`,
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
    console.log('✅ Razorpay order created:', order.id);

    // Try to store payment record (optional - don't fail if this fails)
    console.log('5. Storing payment record...');
    try {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      const { data: paymentId, error: dbError } = await supabaseService
        .rpc('create_payment_record', {
          p_user_id: user.id,
          p_razorpay_order_id: order.id,
          p_amount: amount,
          p_plan_name: plan_name,
          p_plan_duration: plan_duration
        });

      if (dbError) {
        console.warn('Database storage failed:', dbError.message);
      } else {
        console.log('✅ Payment record stored with ID:', paymentId);
      }
    } catch (dbError) {
      console.warn('Database storage error:', dbError);
      // Continue anyway - payment record is optional
    }

    console.log('6. Returning success response...');
    console.log('=== RAZORPAY CREATE ORDER SUCCESS ===');

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
    console.error('=== RAZORPAY CREATE ORDER ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== ERROR END ===');
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});