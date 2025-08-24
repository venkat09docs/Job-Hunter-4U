
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
    console.log('📋 FULL RAZORPAY ORDER RESPONSE:', JSON.stringify(order, null, 2));

    // Get database schema for payments table
    console.log('5. Checking payments table schema...');
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get table schema
    const { data: schemaData, error: schemaError } = await supabaseService.rpc('get_table_schema', { 
      table_name: 'payments' 
    }).single();
    
    if (schemaError) {
      console.log('Could not fetch schema, proceeding with insert...');
    } else {
      console.log('📋 PAYMENTS TABLE SCHEMA:', JSON.stringify(schemaData, null, 2));
    }

    // Try to store payment record (this is now CRITICAL - must succeed)
    console.log('6. Storing payment record (CRITICAL STEP)...');
    try {
      console.log('Creating payment record with exact required fields:');
      const insertData = {
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: amount,
        plan_name: plan_name,
        plan_duration: plan_duration,
        currency: 'INR',
        status: 'pending'
      };
      console.log('📋 INSERT DATA FOR CREATE-ORDER:', JSON.stringify(insertData, null, 2));
      console.log('📋 DATA TYPES CHECK:');
      console.log('- user_id type:', typeof insertData.user_id, 'value:', insertData.user_id);
      console.log('- razorpay_order_id type:', typeof insertData.razorpay_order_id, 'value:', insertData.razorpay_order_id);
      console.log('- amount type:', typeof insertData.amount, 'value:', insertData.amount);
      console.log('- plan_name type:', typeof insertData.plan_name, 'value:', insertData.plan_name);
      console.log('- plan_duration type:', typeof insertData.plan_duration, 'value:', insertData.plan_duration);
      console.log('- currency type:', typeof insertData.currency, 'value:', insertData.currency);
      console.log('- status type:', typeof insertData.status, 'value:', insertData.status);

      const { data: paymentRecord, error: dbError } = await supabaseService
        .from('payments')
        .insert(insertData)
        .select('*')
        .single();

      if (dbError) {
        console.error('❌ CRITICAL: Database storage failed during order creation:', dbError.message);
        console.error('📋 FULL DB ERROR DETAILS:', JSON.stringify(dbError, null, 2));
        console.error('Error code:', dbError.code);
        console.error('Error details:', dbError.details);
        console.error('Error hint:', dbError.hint);
        
        // Try to get more details about the error
        if (dbError.code === '42601') {
          console.error('❌ SQL SYNTAX ERROR: The INSERT statement has column/value mismatch');
          console.error('This usually means we have more columns specified than values provided');
        }
        
        throw new Error(`Payment record creation failed: ${dbError.message} (Code: ${dbError.code})`);
      } else {
        console.log('✅ Payment record stored during order creation with ID:', paymentRecord.id);
        console.log('📋 CREATED PAYMENT RECORD:', JSON.stringify(paymentRecord, null, 2));
      }
    } catch (dbError) {
      console.error('❌ CRITICAL: Database storage exception during order creation:', dbError);
      console.error('📋 FULL EXCEPTION DETAILS:', JSON.stringify(dbError, null, 2));
      throw new Error(`Failed to create payment record: ${dbError.message}`);
    }

    console.log('7. Returning success response...');
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
    console.error('📋 FULL ERROR OBJECT:', JSON.stringify(error, null, 2));
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
