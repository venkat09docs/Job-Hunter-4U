import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced logging with timestamps
const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` | ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] RAZORPAY-CREATE-ORDER: ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('=== STARTING PAYMENT ORDER CREATION ===');
    
    // Parse and validate request
    const requestBody = await req.json();
    const { amount, plan_name, plan_duration } = requestBody;
    
    logStep('Request received', { amount, plan_name, plan_duration });
    
    // Comprehensive validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}. Must be a positive number.`);
    }
    if (!plan_name || typeof plan_name !== 'string' || plan_name.trim() === '') {
      throw new Error(`Invalid plan_name: ${plan_name}. Must be a non-empty string.`);
    }
    if (!plan_duration || typeof plan_duration !== 'string' || plan_duration.trim() === '') {
      throw new Error(`Invalid plan_duration: ${plan_duration}. Must be a non-empty string.`);
    }

    logStep('Request validation passed');

    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Invalid Authorization token format');
    }

    logStep('Initializing Supabase client for auth...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) {
      logStep('Authentication error', { error: userError });
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!userData?.user?.id || !userData?.user?.email) {
      throw new Error('User data incomplete: missing id or email');
    }

    const user = userData.user;
    logStep('User authenticated successfully', { 
      userId: user.id.substring(0, 8) + '...', 
      email: user.email 
    });

    // Check Razorpay credentials
    const razorpayMode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const isLiveMode = razorpayMode === 'live';
    
    const razorpayKeyId = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_ID')
      : Deno.env.get('RAZORPAY_TEST_KEY_ID');
    const razorpayKeySecret = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') 
      : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      logStep('Missing Razorpay credentials', { 
        mode: razorpayMode, 
        hasKeyId: !!razorpayKeyId, 
        hasKeySecret: !!razorpayKeySecret 
      });
      throw new Error(`Razorpay credentials not configured for ${razorpayMode} mode`);
    }

    logStep('Razorpay credentials verified', { mode: razorpayMode });

    // Create Razorpay order - amount should already be in paisa from frontend
    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);
    const amountInPaisa = Math.round(amount); // Ensure integer, amount already in paisa
    const orderData = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: receipt,
      notes: {
        plan_name: plan_name,
        plan_duration: plan_duration,
        user_id: user.id
      }
    };

    logStep('Creating Razorpay order...', orderData);
    
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      logStep('Razorpay API error', { 
        status: razorpayResponse.status, 
        statusText: razorpayResponse.statusText,
        error: errorText 
      });
      throw new Error(`Razorpay API error ${razorpayResponse.status}: ${errorText}`);
    }

    const order = await razorpayResponse.json();
    logStep('Razorpay order created successfully', { 
      orderId: order.id, 
      amount: order.amount, 
      currency: order.currency 
    });

    // Database operations with service role
    logStep('Initializing Supabase service client...');
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false 
        }
      }
    );

    logStep('Inserting payment record...', { 
      user_id: user.id.substring(0, 8) + '...',
      razorpay_order_id: order.id,
      amount: amountInPaisa,
      plan_name: plan_name,
      plan_duration: plan_duration
    });
    
    const { data: paymentRecord, error: dbError } = await supabaseService
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: amountInPaisa, // Store amount in paisa for consistency
        plan_name: plan_name,
        plan_duration: plan_duration
      })
      .select('id, created_at')
      .single();

    if (dbError) {
      logStep('Database insertion failed', { 
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      });
      throw new Error(`Database error: ${dbError.message} (Code: ${dbError.code})`);
    }

    logStep('Payment record created successfully', { 
      recordId: paymentRecord.id,
      createdAt: paymentRecord.created_at
    });

    // Return response
    const responseData = {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: razorpayKeyId,
    };
    
    logStep('=== ORDER CREATION COMPLETED SUCCESSFULLY ===', responseData);

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logStep('=== ORDER CREATION FAILED ===', { 
      error: errorMessage,
      stack: errorStack
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});