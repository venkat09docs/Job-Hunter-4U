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

    // Get Razorpay credentials - Let's also try getting key from env
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') || "rzp_test_MHGnYRilhJ8fI0"; // Your Razorpay Key ID
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    console.log('Razorpay Key ID:', razorpayKeyId);
    console.log('Razorpay Secret exists:', !!razorpayKeySecret);
    console.log('Razorpay Secret length:', razorpayKeySecret?.length || 0);
    
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret key not configured');
    }

    // Check for whitespace or encoding issues
    const trimmedSecret = razorpayKeySecret.trim();
    console.log('Secret after trim length:', trimmedSecret.length);
    console.log('Original secret === trimmed:', razorpayKeySecret === trimmedSecret);
    
    // Test different encoding approaches
    const credentials = btoa(`${razorpayKeyId}:${trimmedSecret}`);
    console.log('Using trimmed secret - Auth header:', credentials.substring(0, 20));
    
    // Verify key ID format
    console.log('Key ID starts with rzp_:', razorpayKeyId.startsWith('rzp_'));
    console.log('Key ID contains test/live:', razorpayKeyId.includes('test') ? 'test' : razorpayKeyId.includes('live') ? 'live' : 'unknown');
    
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
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${trimmedSecret}`)}`,
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