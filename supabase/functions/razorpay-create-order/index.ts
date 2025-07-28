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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create a Supabase client with the Auth context of the user that sent the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { amount, plan_name, plan_duration }: OrderRequest = await req.json();

    if (!amount || !plan_name || !plan_duration) {
      throw new Error('Missing required fields: amount, plan_name, plan_duration');
    }

    // Get Razorpay credentials - Try multiple key configurations
    let razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') || "rzp_test_MHGnYRilhJ8fI0";
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    console.log('=== RAZORPAY DEBUG START ===');
    console.log('Key ID from env:', Deno.env.get('RAZORPAY_KEY_ID'));
    console.log('Using Key ID:', razorpayKeyId);
    console.log('Secret exists:', !!razorpayKeySecret);
    console.log('Secret length:', razorpayKeySecret?.length || 0);
    
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret key not configured');
    }

    // Test with known working test credentials format
    const testKeyId = "rzp_test_MHGnYRilhJ8fI0";
    if (razorpayKeyId !== testKeyId) {
      console.log('WARNING: Key ID mismatch!');
      console.log('Expected:', testKeyId);
      console.log('Got:', razorpayKeyId);
      // Use the hardcoded test key for now
      razorpayKeyId = testKeyId;
    }

    // Validate secret format (should be exactly 24 characters for test keys)
    const trimmedSecret = razorpayKeySecret.trim();
    console.log('Secret after trim:', trimmedSecret.length, 'chars');
    console.log('Secret starts/ends with quotes:', trimmedSecret.startsWith('"') || trimmedSecret.endsWith('"'));
    
    // Remove quotes if present
    const cleanSecret = trimmedSecret.replace(/^["']|["']$/g, '');
    console.log('Clean secret length:', cleanSecret.length);
    
    // Test basic auth string formation
    const authString = `${razorpayKeyId}:${cleanSecret}`;
    const credentials = btoa(authString);
    console.log('Auth string length:', authString.length);
    console.log('Credentials preview:', credentials.substring(0, 30) + '...');
    console.log('=== RAZORPAY DEBUG END ===');
    
    // Create Razorpay order
    const orderData = {
      amount: amount * 100, // Convert to paisa
      currency: 'INR',
      receipt: `receipt_${user.id}_${Date.now()}`,
      notes: {
        plan_name: plan_name,
        plan_duration: plan_duration,
        user_id: user.id
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error:', errorText);
      throw new Error(`Razorpay API error: ${response.status}`);
    }

    const order = await response.json();

    // Store order details in our database
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { error: insertError } = await supabaseService
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: amount,
        currency: 'INR',
        status: 'pending',
        plan_name: plan_name,
        plan_duration: plan_duration,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to store payment details');
    }

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