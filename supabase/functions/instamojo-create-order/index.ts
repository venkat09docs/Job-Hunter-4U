import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== INSTAMOJO CREATE ORDER FUNCTION START ===');

    const { amount, plan_name, plan_duration } = await req.json();
    console.log('Request payload:', { amount, plan_name, plan_duration });

    // Validate required environment variables
    const INSTAMOJO_API_KEY = Deno.env.get('INSTAMOJO_API_KEY');
    const INSTAMOJO_AUTH_TOKEN = Deno.env.get('INSTAMOJO_AUTH_TOKEN');
    
    if (!INSTAMOJO_API_KEY || !INSTAMOJO_AUTH_TOKEN) {
      console.error('Missing Instamojo credentials');
      return new Response(
        JSON.stringify({ error: 'Instamojo credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client for service role operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabaseService.auth.getUser(jwt);

    if (userError || !user.user) {
      console.error('Invalid user token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User authenticated:', user.user.id);

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', amount);
      return new Response(
        JSON.stringify({ error: 'Invalid amount specified' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Convert amount from paisa to rupees for Instamojo (Instamojo uses rupees, not paisa)
    const amountInRupees = Math.round(amount / 100);
    
    console.log('Creating Instamojo payment request...');
    console.log('Amount in rupees:', amountInRupees);

      // Create payment request with Instamojo
      const instamojoPayload = {
        purpose: `${plan_name} - ${plan_duration}`,
        amount: amountInRupees.toString(),
        buyer_name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || 'Customer',
        email: user.user.email,
        phone: '9999999999', // Default phone for Indian market
        redirect_url: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard`,
        send_email: true,
        webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/instamojo-webhook`,
        send_sms: false,
        allow_repeated_payments: false
      };

      console.log('Instamojo API payload:', instamojoPayload);

      const instamojoResponse = await fetch('https://instamojo.com/api/1.1/payment-requests/', {
        method: 'POST',
        headers: {
          'X-Api-Key': INSTAMOJO_API_KEY,
          'X-Auth-Token': INSTAMOJO_AUTH_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(instamojoPayload).toString()
      });

    const instamojoData = await instamojoResponse.json();
    console.log('Instamojo API response:', instamojoData);

    if (!instamojoResponse.ok || !instamojoData.success) {
      console.error('Instamojo API error:', instamojoData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment request',
          details: instamojoData.message || 'Payment gateway error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const paymentRequest = instamojoData.payment_request;
    console.log('✅ Payment request created successfully:', paymentRequest.id);

    // Store payment record in database using the helper function
    console.log('Creating payment record in database...');
    
    const { data: paymentData, error: insertError } = await supabaseService
      .rpc('create_payment_record', {
        p_user_id: user.user.id,
        p_razorpay_order_id: paymentRequest.id, // Store Instamojo payment request ID
        p_amount: amount, // Store in paisa for consistency 
        p_plan_name: plan_name,
        p_plan_duration: plan_duration
      });

    if (insertError) {
      console.error('CRITICAL: Database function error:', insertError);
      console.error('This will cause verification to fail!');
      throw new Error(`Failed to create payment record: ${insertError.message}`);
    } else {
      console.log('✅ Payment record created successfully:', paymentData);
    }

    // Return successful response with payment URL
    const response = {
      success: true,
      payment_url: paymentRequest.longurl,
      payment_id: paymentRequest.id,
      amount: amount,
      currency: 'INR',
      gateway: 'instamojo'
    };

    console.log('✅ Instamojo order creation successful:', response);
    console.log('=== INSTAMOJO CREATE ORDER FUNCTION END ===');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ INSTAMOJO CREATE ORDER ERROR:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});