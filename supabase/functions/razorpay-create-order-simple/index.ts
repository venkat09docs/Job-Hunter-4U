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

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'Function working',
        mode: Deno.env.get('RAZORPAY_MODE') || 'test',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { amount, plan_name, plan_duration } = body;
    
    if (!amount || !plan_name || !plan_duration) {
      throw new Error('Missing required fields');
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No auth header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Auth failed');

    // Razorpay config with debugging
    const mode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const isLive = mode === 'live';
    
    const keyId = isLive ? Deno.env.get('RAZORPAY_LIVE_KEY_ID') : Deno.env.get('RAZORPAY_TEST_KEY_ID');
    const keySecret = isLive ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    console.log('🔑 Credentials check:', {
      mode,
      keyIdExists: !!keyId,
      keySecretExists: !!keySecret,
      keyIdPrefix: keyId ? keyId.substring(0, 8) + '...' : 'MISSING'
    });
    
    if (!keyId || !keySecret) {
      throw new Error(`Missing ${mode} mode credentials - keyId: ${!!keyId}, keySecret: ${!!keySecret}`);
    }

    // Create Razorpay order
    const orderPayload = {
      amount: parseInt(amount),
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: { plan_name, plan_duration, user_id: user.id }
    };

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      throw new Error(`Razorpay error: ${errorText}`);
    }

    const razorpayOrder = await razorpayResponse.json();

    // Create payment record
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('📝 Creating payment record for order:', razorpayOrder.id);
    console.log('📝 Payment details:', {
      user_id: user.id,
      order_id: razorpayOrder.id,
      amount: parseInt(amount),
      plan_name,
      plan_duration
    });

    const { data: paymentId, error: dbError } = await supabaseService.rpc('create_payment_record', {
      p_user_id: user.id,
      p_razorpay_order_id: razorpayOrder.id,
      p_amount: parseInt(amount),
      p_plan_name: plan_name,
      p_plan_duration: plan_duration
    });

    if (dbError) {
      console.error('❌ Database error creating payment record:', dbError);
      throw new Error(`DB error: ${dbError.message}`);
    }

    console.log('✅ Payment record created successfully with ID:', paymentId);

    // Verify the record was actually created
    const { data: verifyRecord, error: verifyError } = await supabaseService
      .from('payment_records')
      .select('*')
      .eq('razorpay_order_id', razorpayOrder.id)
      .eq('user_id', user.id)
      .single();

    if (verifyError || !verifyRecord) {
      console.error('❌ Failed to verify payment record creation:', verifyError);
      throw new Error('Payment record was not created properly');
    }

    console.log('✅ Payment record verified in database:', verifyRecord);

    return new Response(
      JSON.stringify({
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: keyId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
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