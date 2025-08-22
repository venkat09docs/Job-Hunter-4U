import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderRequest {
  amount: number; // Amount in INR
  plan_name: string;
  plan_duration: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CREATE ORDER DEBUG START ===');
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header exists:', !!authHeader);
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('Authentication required. Please login and try again.');
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    // Create Supabase client for authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Validate user authentication
    console.log('Attempting to authenticate user...');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error('Authentication error:', userError.message);
      throw new Error(`Authentication failed: ${userError.message}. Please refresh the page and login again.`);
    }
    
    if (!userData || !userData.user) {
      console.error('No user data returned from auth');
      throw new Error('User session expired. Please refresh the page and login again.');
    }
    
    const user = userData.user;
    if (!user.email) {
      console.error('User email not available:', user);
      throw new Error('User email not available. Please complete your profile setup.');
    }
    
    console.log('✅ User authenticated successfully:', user.email);
    console.log('User ID:', user.id);
    console.log('User role:', user.role);

    // Parse request body
    console.log('Parsing request body...');
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { amount, plan_name, plan_duration }: OrderRequest = requestBody;

    if (!amount || !plan_name || !plan_duration) {
      throw new Error('Missing required fields: amount, plan_name, plan_duration');
    }

    // Get environment mode - defaulting to test for safety
    const razorpayMode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const isLiveMode = razorpayMode === 'live';
    
    console.log('=== RAZORPAY DEBUG START ===');
    console.log('RAZORPAY_MODE from env:', Deno.env.get('RAZORPAY_MODE'));
    console.log('Computed mode:', razorpayMode);
    console.log('Is live mode:', isLiveMode);
    
    // Get environment-specific Razorpay credentials
    const razorpayKeyId = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_ID')
      : Deno.env.get('RAZORPAY_TEST_KEY_ID');
    const razorpayKeySecret = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') 
      : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    console.log('Key ID from env:', razorpayKeyId);
    console.log('Using Key ID:', razorpayKeyId);
    console.log('Secret exists:', !!razorpayKeySecret);
    console.log('Secret starts/ends with quotes:', razorpayKeySecret?.startsWith('"') || razorpayKeySecret?.endsWith('"'));
    console.log('Secret length:', razorpayKeySecret?.length);
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      const missingCreds = isLiveMode ? 'RAZORPAY_LIVE_KEY_ID/RAZORPAY_LIVE_KEY_SECRET' : 'RAZORPAY_TEST_KEY_ID/RAZORPAY_TEST_KEY_SECRET';
      console.error(`Missing ${isLiveMode ? 'live' : 'test'} credentials:`, missingCreds);
      throw new Error(`Razorpay ${isLiveMode ? 'live' : 'test'} credentials not configured`);
    }

    // Clean the secret (remove any quotes or whitespace)
    const cleanSecret = razorpayKeySecret.trim().replace(/^["']|["']$/g, '');
    console.log('Clean secret length:', cleanSecret.length);
    console.log('Secret after trim:', cleanSecret.length, 'chars');
    
    // Validate key ID format matches environment
    const expectedPrefix = isLiveMode ? 'rzp_live_' : 'rzp_test_';
    if (!razorpayKeyId.startsWith(expectedPrefix)) {
      console.log('WARNING: Key ID mismatch!');
      console.log('Got:', razorpayKeyId);
      console.log('Expected:', expectedPrefix + 'XXXXXXXXXXXXXXX');
    }
    
    // Create authentication string and log preview for debugging
    const authString = btoa(`${razorpayKeyId}:${cleanSecret}`);
    console.log('Auth string length:', authString.length);
    console.log('Credentials preview:', authString.substring(0, 30) + '...');
    console.log('=== RAZORPAY DEBUG END ===');
    
    // Create Razorpay order
    // Generate receipt with proper length limit (max 40 characters for Razorpay)
    const timestamp = Date.now().toString();
    const userIdShort = user.id.slice(0, 8); // Take first 8 chars of UUID
    const receipt = `rcpt_${userIdShort}_${timestamp}`.slice(0, 40);
    
    console.log('Generated receipt:', receipt, '(length:', receipt.length, ')');
    
    const orderData = {
      amount: amount * 100, // Convert to paisa
      currency: 'INR',
      receipt: receipt,
      notes: {
        plan_name: plan_name,
        plan_duration: plan_duration,
        user_id: user.id,
        full_user_id: user.id // Store full user ID in notes for reference
      }
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${cleanSecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    console.log('Razorpay API response status:', response.status);
    console.log('Razorpay API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error response:', errorText);
      console.error('Razorpay API error status:', response.status);
      throw new Error(`Razorpay API error: ${response.status} - ${errorText}`);
    }

    const order = await response.json();
    console.log('✅ Razorpay order created successfully:', order);

    // Store order details in our database
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Attempting to insert payment record...');
    
    // Debug: Check if service client is properly initialized
    console.log('Service client URL:', Deno.env.get('SUPABASE_URL'));
    console.log('Service role key exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    // First check if this order already exists
    const { data: existingOrder } = await supabaseService
      .from('payments')
      .select('id')
      .eq('razorpay_order_id', order.id)
      .maybeSingle();
      
    if (existingOrder) {
      console.log('Order already exists in database:', order.id);
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
    }
    
    // Insert with only the absolutely required fields to debug
    console.log('Attempting minimal database insert with only required fields...');
    console.log('User ID:', user.id);
    console.log('Order ID:', order.id); 
    console.log('Amount:', amount);
    console.log('Plan name:', plan_name);
    console.log('Plan duration:', plan_duration);
    
    const { error: insertError } = await supabaseService
      .from('payments')
      .insert({
        user_id: user.id,
        amount: amount,
        plan_name: plan_name,
        plan_duration: plan_duration
      });

    console.log('Insert error:', insertError);

    if (insertError) {
      console.error('Database insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      throw new Error(`Failed to store payment details: ${insertError.message}`);
    }

    console.log('✅ Payment record created successfully');

    console.log('Order created successfully:', order.id);

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
    console.error('Error in create-order function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});