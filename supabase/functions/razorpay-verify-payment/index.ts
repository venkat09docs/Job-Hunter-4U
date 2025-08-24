
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Function to verify Razorpay signature using Web Crypto API
async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  try {
    const text = `${orderId}|${paymentId}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const textData = encoder.encode(text);
    
    // Import the secret key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Generate the signature
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, textData);
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('Generated signature:', generatedSignature);
    console.log('Received signature:', signature);
    console.log('Text for signature:', text);
    
    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Helper function to calculate subscription end date
function calculateSubscriptionEndDate(duration: string): Date {
  const now = new Date();
  const endDate = new Date(now);
  
  switch (duration.toLowerCase()) {
    case '1 week':
    case 'one week':
      endDate.setDate(now.getDate() + 7);
      break;
    case '1 month':
    case 'one month':
      endDate.setMonth(now.getMonth() + 1);
      break;
    case '3 months':
    case 'three months':
      endDate.setMonth(now.getMonth() + 3);
      break;
    case '1 year':
    case 'one year':
      endDate.setFullYear(now.getFullYear() + 1);
      break;
    default:
      // Default to 1 month if duration is not recognized
      endDate.setMonth(now.getMonth() + 1);
  }
  
  return endDate;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== PAYMENT VERIFICATION START ===');
    console.log('Request method:', req.method);
    
    // Parse request body
    const requestBody = await req.json();
    console.log('📋 FULL REQUEST BODY FROM RAZORPAY:', JSON.stringify(requestBody, null, 2));
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, upgrade_end_date } = requestBody;

    console.log('📋 EXTRACTED FIELDS FROM RAZORPAY:');
    console.log('- razorpay_order_id:', razorpay_order_id, 'type:', typeof razorpay_order_id);
    console.log('- razorpay_payment_id:', razorpay_payment_id, 'type:', typeof razorpay_payment_id);
    console.log('- razorpay_signature:', razorpay_signature, 'type:', typeof razorpay_signature);
    console.log('- upgrade_end_date:', upgrade_end_date, 'type:', typeof upgrade_end_date);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log('❌ MISSING FIELDS VALIDATION:');
      console.log('- razorpay_order_id present:', !!razorpay_order_id);
      console.log('- razorpay_payment_id present:', !!razorpay_payment_id);
      console.log('- razorpay_signature present:', !!razorpay_signature);
      throw new Error('Missing required payment verification fields');
    }

    // Authenticate user - Create client with service role first to validate token
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received, length:', token.length);

    // Verify user token manually using service role
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    
    if (userError || !userData.user?.id) {
      console.error('Authentication error:', userError);
      console.log('Token validation failed for user verification');
      throw new Error('User not authenticated');
    }
    
    const userId = userData.user.id;
    console.log('✅ User authenticated successfully:', userData.user.email);
    console.log('User ID:', userId);

    // Determine which secret key to use based on mode
    const razorpayMode = Deno.env.get('RAZORPAY_MODE') || 'test';
    const isLiveMode = razorpayMode === 'live';
    
    const razorpayKeySecret = isLiveMode 
      ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') 
      : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
    
    if (!razorpayKeySecret) {
      throw new Error(`Razorpay ${isLiveMode ? 'live' : 'test'} secret key not configured`);
    }
    
    console.log('Using', isLiveMode ? 'live' : 'test', 'mode for verification');

    // Verify the signature
    console.log('Starting signature verification...');
    const isValidSignature = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpayKeySecret);
    
    if (!isValidSignature) {
      console.error('❌ Signature verification failed');
      throw new Error('Invalid payment signature');
    }
    
    console.log('✅ Payment signature verified successfully');

    // Get database schema for payments table
    console.log('=== DATABASE SCHEMA CHECK ===');
    try {
      const { data: schemaData, error: schemaError } = await supabaseService.rpc('get_table_schema', { 
        table_name: 'payments' 
      }).single();
      
      if (schemaError) {
        console.log('Could not fetch schema:', schemaError);
      } else {
        console.log('📋 PAYMENTS TABLE SCHEMA:', JSON.stringify(schemaData, null, 2));
      }
    } catch (schemaErr) {
      console.log('Schema fetch failed, continuing...');
    }

    // STEP 1: Try to find existing payment record
    console.log('=== STEP 1: Looking for existing payment record ===');
    console.log('Searching for order:', razorpay_order_id, 'user:', userId);
    
    let { data: paymentData, error: fetchError } = await supabaseService
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    console.log('📋 PAYMENT SEARCH RESULT:');
    console.log('- paymentData:', paymentData ? 'FOUND' : 'NOT FOUND');
    console.log('- fetchError:', fetchError ? JSON.stringify(fetchError, null, 2) : 'NONE');
    
    if (paymentData) {
      console.log('📋 FOUND PAYMENT DATA:', JSON.stringify(paymentData, null, 2));
      console.log('📋 PAYMENT DATA FIELD ANALYSIS:');
      console.log('- id:', paymentData.id, 'type:', typeof paymentData.id);
      console.log('- user_id:', paymentData.user_id, 'type:', typeof paymentData.user_id);
      console.log('- razorpay_order_id:', paymentData.razorpay_order_id, 'type:', typeof paymentData.razorpay_order_id);
      console.log('- amount:', paymentData.amount, 'type:', typeof paymentData.amount);
      console.log('- plan_name:', paymentData.plan_name, 'type:', typeof paymentData.plan_name);
      console.log('- plan_duration:', paymentData.plan_duration, 'type:', typeof paymentData.plan_duration);
      console.log('- status:', paymentData.status, 'type:', typeof paymentData.status);
    }

    // STEP 2: If not found, try without user filter
    if (!paymentData && !fetchError) {
      console.log('=== STEP 2: Payment record not found with user filter, searching without user filter ===');
      
      const { data: debugData, error: debugError } = await supabaseService
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id)
        .maybeSingle();
      
      console.log('📋 PAYMENT SEARCH WITHOUT USER FILTER:');
      console.log('- debugData:', debugData ? 'FOUND' : 'NOT FOUND');
      console.log('- debugError:', debugError ? JSON.stringify(debugError, null, 2) : 'NONE');
      
      if (debugData) {
        console.log('📋 PAYMENT DATA WITHOUT USER FILTER:', JSON.stringify(debugData, null, 2));
        console.log('Expected user_id:', userId, 'Found user_id:', debugData.user_id);
        console.log('User ID match:', debugData.user_id === userId);
        
        if (debugData.user_id === userId) {
          console.log('✅ Found payment record without user filter, and user_id matches');
          paymentData = debugData;
        } else {
          console.log('❌ Found payment record but user_id does not match');
          throw new Error('Payment record exists but belongs to different user');
        }
      }
    }

    // STEP 3: If still not found, this is an error
    if (!paymentData) {
      console.log('=== STEP 3: No payment record found - this should not happen ===');
      console.error('❌ No payment record found for order:', razorpay_order_id);
      console.error('This suggests the order creation did not create a payment record properly');
      throw new Error('Payment record not found. Order may not have been created properly.');
    }

    console.log('✅ Using payment record:', paymentData.id, 'Plan:', paymentData.plan_name);

    // STEP 4: Update payment status with verification details
    console.log('=== STEP 4: Updating payment status to completed ===');
    
    const updateData = {
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      status: 'completed',
      updated_at: new Date().toISOString(),
    };
    
    console.log('📋 UPDATE DATA FOR PAYMENT:', JSON.stringify(updateData, null, 2));
    console.log('📋 UPDATE DATA TYPES:');
    console.log('- razorpay_payment_id type:', typeof updateData.razorpay_payment_id);
    console.log('- razorpay_signature type:', typeof updateData.razorpay_signature);
    console.log('- status type:', typeof updateData.status);
    console.log('- updated_at type:', typeof updateData.updated_at);
    
    const { error: updateError } = await supabaseService
      .from('payments')
      .update(updateData)
      .eq('id', paymentData.id);

    if (updateError) {
      console.error('❌ Payment update error:', updateError);
      console.error('📋 FULL UPDATE ERROR:', JSON.stringify(updateError, null, 2));
      throw new Error(`Failed to update payment status: ${updateError.message}`);
    }
    
    console.log('✅ Payment status updated to completed');

    // STEP 5: Calculate subscription dates and update profile
    console.log('=== STEP 5: Updating user profile with subscription ===');
    const startDate = new Date();
    const endDate = upgrade_end_date ? new Date(upgrade_end_date) : calculateSubscriptionEndDate(paymentData.plan_duration);

    console.log('📋 SUBSCRIPTION DATES:');
    console.log('- startDate:', startDate.toISOString());
    console.log('- endDate:', endDate.toISOString());
    console.log('- isUpgrade:', !!upgrade_end_date);

    const profileUpdateData = {
      subscription_plan: paymentData.plan_name,
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      subscription_active: true,
      updated_at: new Date().toISOString(),
    };
    
    console.log('📋 PROFILE UPDATE DATA:', JSON.stringify(profileUpdateData, null, 2));

    const { error: profileError } = await supabaseService
      .from('profiles')
      .update(profileUpdateData)
      .eq('user_id', paymentData.user_id);

    if (profileError) {
      console.error('❌ Profile update error:', profileError);
      console.error('📋 FULL PROFILE ERROR:', JSON.stringify(profileError, null, 2));
      throw new Error(`Failed to update subscription: ${profileError.message}`);
    }

    console.log('✅ Subscription activated successfully for user:', paymentData.user_id);
    console.log('Plan:', paymentData.plan_name, 'Valid until:', endDate.toISOString());
    console.log('=== PAYMENT VERIFICATION END SUCCESS ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and subscription activated',
        subscription: {
          plan: paymentData.plan_name,
          duration: paymentData.plan_duration,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('=== PAYMENT VERIFICATION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('📋 FULL ERROR OBJECT:', JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        error_type: error?.name || 'Unknown',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
