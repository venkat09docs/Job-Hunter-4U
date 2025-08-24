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
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, upgrade_end_date } = requestBody;

    console.log('Extracted fields:', { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      upgrade_end_date 
    });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log('Missing fields validation failed:', { 
        razorpay_order_id: !!razorpay_order_id, 
        razorpay_payment_id: !!razorpay_payment_id, 
        razorpay_signature: !!razorpay_signature 
      });
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

    // STEP 1: Try to find existing payment record first
    console.log('=== STEP 1: Looking for existing payment record ===');
    console.log('Searching for order:', razorpay_order_id, 'user:', userId);
    
    let { data: paymentData, error: fetchError } = await supabaseService
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

    console.log('Initial payment search result:', { paymentData, fetchError });

    // STEP 2: If not found, try without user filter (maybe created during order creation)
    if (!paymentData && !fetchError) {
      console.log('=== STEP 2: Payment record not found with user filter, searching without user filter ===');
      
      const { data: debugData, error: debugError } = await supabaseService
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id)
        .maybeSingle();
      
      console.log('Payment search without user filter:', { debugData, debugError });
      
      if (debugData && debugData.user_id === userId) {
        console.log('✅ Found payment record without user filter, and user_id matches');
        paymentData = debugData;
      } else if (debugData && debugData.user_id !== userId) {
        console.log('❌ Found payment record but user_id does not match');
        console.log('Expected user_id:', userId, 'Found user_id:', debugData.user_id);
        throw new Error('Payment record exists but belongs to different user');
      }
    }

    // STEP 3: If still not found, create it based on Razorpay order data
    if (!paymentData) {
      console.log('=== STEP 3: Creating payment record from Razorpay order data ===');
      
      const razorpayKeyId = isLiveMode 
        ? Deno.env.get('RAZORPAY_LIVE_KEY_ID')
        : Deno.env.get('RAZORPAY_TEST_KEY_ID');
      
      console.log('Fetching order details from Razorpay for order:', razorpay_order_id);
      const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`
        }
      });
      
      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('❌ Failed to fetch order from Razorpay:', orderResponse.status, errorText);
        throw new Error(`Failed to fetch Razorpay order: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      console.log('✅ Razorpay order data:', JSON.stringify(orderData, null, 2));
      
      // Create payment record based on order notes
      const planName = orderData.notes?.plan_name || 'One Week Plan';
      const planDuration = orderData.notes?.plan_duration || '1 week';
      const amount = Math.floor(orderData.amount / 100); // Convert from paisa to rupees
      
      console.log('Attempting to create payment record with exact required data:');
      const insertData = {
        user_id: userId,
        razorpay_order_id: razorpay_order_id,
        amount: amount,
        plan_name: planName,
        plan_duration: planDuration
      };
      console.log('Insert data:', JSON.stringify(insertData, null, 2));
      
      try {
        const { data: newPaymentData, error: insertError } = await supabaseService
          .from('payments')
          .insert(insertData)
          .select('*')
          .single();
        
        if (insertError) {
          console.error('❌ Payment insert failed with error:', insertError);
          console.error('Error code:', insertError.code);
          console.error('Error message:', insertError.message);
          console.error('Error details:', insertError.details);
          console.error('Error hint:', insertError.hint);
          throw new Error(`Database insert failed: ${insertError.message} (Code: ${insertError.code})`);
        }
        
        console.log('✅ Payment record created successfully:', newPaymentData.id);
        paymentData = newPaymentData;
      } catch (dbError) {
        console.error('❌ Database error during payment creation:', dbError);
        throw new Error(`Failed to create payment record: ${dbError.message}`);
      }
    }

    if (!paymentData) {
      throw new Error('Could not find or create payment record');
    }
    
    console.log('✅ Using payment record:', paymentData.id, 'Plan:', paymentData.plan_name);

    // STEP 4: Update payment status with verification details
    console.log('=== STEP 4: Updating payment status to completed ===');
    const { error: updateError } = await supabaseService
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentData.id);

    if (updateError) {
      console.error('❌ Payment update error:', updateError);
      throw new Error(`Failed to update payment status: ${updateError.message}`);
    }
    
    console.log('✅ Payment status updated to completed');

    // STEP 5: Calculate subscription dates and update profile
    console.log('=== STEP 5: Updating user profile with subscription ===');
    const startDate = new Date();
    const endDate = upgrade_end_date ? new Date(upgrade_end_date) : calculateSubscriptionEndDate(paymentData.plan_duration);

    console.log('Subscription dates:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      isUpgrade: !!upgrade_end_date 
    });

    const { error: profileError } = await supabaseService
      .from('profiles')
      .update({
        subscription_plan: paymentData.plan_name,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        subscription_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', paymentData.user_id);

    if (profileError) {
      console.error('❌ Profile update error:', profileError);
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
    console.error('Full error object:', error);
    
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