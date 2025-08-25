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
    console.log('=== INSTAMOJO VERIFY PAYMENT FUNCTION START ===');

    const { payment_id, payment_request_id } = await req.json();
    console.log('Request payload:', { payment_id, payment_request_id });

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

    // Verify payment with Instamojo API
    console.log('Verifying payment with Instamojo...');
    
    const verifyResponse = await fetch(`https://instamojo.com/api/1.1/payments/${payment_id}/`, {
      method: 'GET',
      headers: {
        'X-Api-Key': INSTAMOJO_API_KEY,
        'X-Auth-Token': INSTAMOJO_AUTH_TOKEN,
      }
    });

    const verifyData = await verifyResponse.json();
    console.log('Instamojo verification response:', verifyData);

    if (!verifyResponse.ok || !verifyData.success) {
      console.error('Payment verification failed:', verifyData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment verification failed',
          details: verifyData.message || 'Verification error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const payment = verifyData.payment;
    
    // Check if payment status is Credit (successful)
    if (payment.status !== 'Credit') {
      console.error('Payment not successful:', payment.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment not completed',
          status: payment.status
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Payment verified successfully');

    // Find the payment record in database
    const { data: paymentRecord, error: fetchError } = await supabaseService
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', payment_request_id)
      .eq('user_id', user.user.id)
      .single();

    if (fetchError || !paymentRecord) {
      console.error('Payment record not found:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment record not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update payment record with successful payment details
    const { error: updateError } = await supabaseService
      .from('payments')
      .update({
        razorpay_payment_id: payment_id,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('Failed to update payment record:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update payment record' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate subscription end date based on plan duration
    let durationInDays = 7; // Default to 1 week
    const duration = paymentRecord.plan_duration.toLowerCase();
    
    if (duration.includes('month')) {
      const months = parseInt(duration) || 1;
      durationInDays = months * 30;
    } else if (duration.includes('year')) {
      durationInDays = 365;
    } else if (duration.includes('week')) {
      const weeks = parseInt(duration) || 1;
      durationInDays = weeks * 7;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationInDays);

    // Update user profile with subscription
    const { error: profileError } = await supabaseService
      .from('profiles')
      .update({
        subscription_plan: paymentRecord.plan_name,
        subscription_active: true,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.user.id);

    if (profileError) {
      console.error('Failed to update user subscription:', profileError);
      // Don't fail the whole operation, just log the error
    } else {
      console.log('✅ User subscription updated successfully');
    }

    const response = {
      success: true,
      payment_id: payment_id,
      amount: payment.amount,
      status: payment.status,
      gateway: 'instamojo'
    };

    console.log('✅ Payment verification successful:', response);
    console.log('=== INSTAMOJO VERIFY PAYMENT FUNCTION END ===');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ INSTAMOJO VERIFY PAYMENT ERROR:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
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