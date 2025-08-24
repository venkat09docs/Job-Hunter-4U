import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== TESTING PAYMENT INSERT ===');
    
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    
    if (userError || !userData.user?.id) {
      throw new Error('User not authenticated');
    }
    
    const userId = userData.user.id;
    console.log('✅ User authenticated:', userData.user.email, userId);

    // Test payment data
    const testPaymentData = {
      user_id: userId,
      razorpay_order_id: `test_order_${Date.now()}`,
      amount: 699,
      plan_name: 'One Week Plan',
      plan_duration: '1 week'
    };

    console.log('📝 Attempting to insert payment with data:');
    console.log(JSON.stringify(testPaymentData, null, 2));

    // Attempt 1: Direct insert
    console.log('🔍 ATTEMPT 1: Direct insert with minimal fields');
    const { data: result1, error: error1 } = await supabaseService
      .from('payments')
      .insert(testPaymentData)
      .select('*')
      .single();

    if (error1) {
      console.error('❌ ATTEMPT 1 FAILED:', error1);
      console.error('Error code:', error1.code);
      console.error('Error message:', error1.message);
      console.error('Error details:', error1.details);
      console.error('Error hint:', error1.hint);
    } else {
      console.log('✅ ATTEMPT 1 SUCCESS:', result1);
      
      // Clean up test data
      await supabaseService
        .from('payments')
        .delete()
        .eq('id', result1.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          method: 'direct_insert',
          result: result1 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Attempt 2: Insert with explicit all columns
    console.log('🔍 ATTEMPT 2: Insert with all columns explicit');
    const fullPaymentData = {
      user_id: userId,
      razorpay_order_id: `test_order_full_${Date.now()}`,
      razorpay_payment_id: null,
      razorpay_signature: null,
      amount: 699,
      currency: 'INR',
      status: 'pending',
      plan_name: 'One Week Plan',
      plan_duration: '1 week'
    };

    console.log('📝 Full payment data:');
    console.log(JSON.stringify(fullPaymentData, null, 2));

    const { data: result2, error: error2 } = await supabaseService
      .from('payments')
      .insert(fullPaymentData)
      .select('*')
      .single();

    if (error2) {
      console.error('❌ ATTEMPT 2 FAILED:', error2);
    } else {
      console.log('✅ ATTEMPT 2 SUCCESS:', result2);
      
      // Clean up test data
      await supabaseService
        .from('payments')
        .delete()
        .eq('id', result2.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          method: 'full_insert',
          result: result2 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Both failed
    return new Response(
      JSON.stringify({ 
        success: false, 
        error1: error1,
        error2: error2,
        message: 'Both insert attempts failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );

  } catch (error) {
    console.error('=== TEST PAYMENT INSERT ERROR ===');
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});