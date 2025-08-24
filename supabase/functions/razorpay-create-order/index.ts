import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive logging function
const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[${timestamp}] [RAZORPAY-CREATE-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('=== Function Started ===');
    
    // Parse request
    const requestBody = await req.json();
    const { amount, plan_name, plan_duration } = requestBody;
    logStep('Request received', { amount, plan_name, plan_duration });

    // Validate request data
    if (!amount || !plan_name || !plan_duration) {
      throw new Error('Missing required fields: amount, plan_name, plan_duration');
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    logStep('Request validation passed');

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

    logStep('Authenticating user...');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      logStep('Authentication failed', { userError });
      throw new Error('Authentication failed');
    }

    const user = userData.user;
    logStep('User authenticated', { userId: user.id, email: user.email });

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

    logStep('Razorpay credentials verified', { mode: razorpayMode });

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

    logStep('Creating Razorpay order...', orderData);
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
      logStep('Razorpay API error', { status: response.status, error: errorText });
      throw new Error(`Razorpay API error: ${response.status} - ${errorText}`);
    }

    const order = await response.json();
    logStep('Razorpay order created successfully', { orderId: order.id, amount: order.amount });

    // Store payment record using service role
    logStep('Initializing Supabase service client...');
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false 
        },
        db: { 
          schema: 'public' 
        }
      }
    );

    // Prepare insert data
    const insertData = {
      user_id: user.id,
      razorpay_order_id: order.id,
      amount: amount,
      plan_name: plan_name,
      plan_duration: plan_duration,
      currency: 'INR',
      status: 'pending'
    };
    
    logStep('Storing payment record...', { insertData });
    
    const { data: paymentRecord, error: dbError } = await supabaseService
      .from('payments')
      .insert(insertData)
      .select('id')
      .single();

    if (dbError) {
      logStep('Database error occurred', { 
        error: dbError, 
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint 
      });
      throw new Error(`Database error: ${dbError.message}`);
    }

    logStep('Payment record created successfully', { paymentRecordId: paymentRecord.id });
    logStep('=== Order Creation Success ===');

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('=== Order Creation Error ===', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});