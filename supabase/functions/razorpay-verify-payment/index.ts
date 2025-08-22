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
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
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

    // Get the payment record to fetch plan details
    console.log('Fetching payment record for order:', razorpay_order_id, 'user:', userId);
    let { data: paymentData, error: fetchError } = await supabaseService
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single();

    // If not found, try to create a payment record based on the Razorpay order
    if (fetchError || !paymentData) {
      console.log('❌ Payment record not found, error:', fetchError);
      console.log('Trying to find without user filter...');
      
      // Try to find payment without user_id filter to debug
      const { data: debugData, error: debugError } = await supabaseService
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id);
      console.log('Debug - All payments for order:', debugData, 'Error:', debugError);
      
      console.log('Trying to find any payments for this user...');
      const { data: userPayments, error: userPaymentsError } = await supabaseService
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .limit(3);
      console.log('User payments:', userPayments, 'Error:', userPaymentsError);
      
      // Fetch order details from Razorpay to get plan info
      const razorpayKeySecret = isLiveMode 
        ? Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') 
        : Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
      const razorpayKeyId = isLiveMode 
        ? Deno.env.get('RAZORPAY_LIVE_KEY_ID')
        : Deno.env.get('RAZORPAY_TEST_KEY_ID');
      
      try {
        console.log('Fetching order details from Razorpay for order:', razorpay_order_id);
        const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
          headers: {
            'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret.trim()}`)}`
          }
        });
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          console.log('✅ Razorpay order data:', JSON.stringify(orderData, null, 2));
          
          // Create payment record based on order notes
          const planName = orderData.notes?.plan_name || 'One Week Plan';
          const planDuration = orderData.notes?.plan_duration || '1 week';
          const amount = Math.floor(orderData.amount / 100); // Convert from paisa to rupees
          
          console.log('Creating payment record with:', { 
            userId, 
            razorpay_order_id, 
            amount, 
            planName, 
            planDuration 
          });
          
          // Use the create_payment_record function (safer approach)
          console.log('Creating payment record using function...');
          const { data: newPaymentId, error: createError } = await supabaseService
            .rpc('create_payment_record', {
              p_user_id: userId,
              p_razorpay_order_id: razorpay_order_id,
              p_amount: amount,
              p_plan_name: planName,
              p_plan_duration: planDuration
            });
          
          if (createError) {
            console.error('❌ Failed to create payment record via function:', createError);
            throw new Error(`Failed to create payment record: ${createError.message}`);
          }
          
          console.log('✅ Payment record created via function with ID:', newPaymentId);
          
          // Fetch the newly created record
          const { data: newPaymentData, error: newFetchError } = await supabaseService
            .from('payments')
            .select('*')
            .eq('razorpay_order_id', razorpay_order_id)
            .eq('user_id', userId)
            .single();
          
          if (newFetchError || !newPaymentData) {
            console.error('❌ Failed to fetch payment record after creation:', newFetchError);
            throw new Error('Payment record created but could not be retrieved');
          }
          
          paymentData = newPaymentData;
          console.log('✅ Payment record retrieved successfully');
        } else {
          const errorText = await orderResponse.text();
          console.error('❌ Failed to fetch order from Razorpay:', orderResponse.status, errorText);
          throw new Error(`Failed to fetch Razorpay order: ${orderResponse.status}`);
        }
      } catch (razorpayError) {
        console.error('❌ Failed to fetch order from Razorpay:', razorpayError);
        throw new Error(`Payment record not found and could not be created: ${razorpayError.message}`);
      }
      
      // If we still don't have payment data, fail
      if (!paymentData) {
        throw new Error('Payment record not found and could not be created');
      }
    }
    
    console.log('✅ Found payment record:', paymentData.id, 'Plan:', paymentData.plan_name);

    // Update payment status with verification details
    console.log('Updating payment status to paid...');
    const { error: updateError } = await supabaseService
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (updateError) {
      console.error('❌ Payment update error:', updateError);
      throw new Error('Failed to update payment status');
    }
    
    console.log('✅ Payment status updated to paid');

    // Calculate subscription dates - use upgrade_end_date if provided (for upgrades with remaining days)
    const startDate = new Date();
    const endDate = upgrade_end_date ? new Date(upgrade_end_date) : calculateSubscriptionEndDate(paymentData.plan_duration);

    console.log('Subscription dates:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      isUpgrade: !!upgrade_end_date 
    });

    // Update user profile with subscription details
    console.log('Updating user profile with subscription details...');
    console.log('Profile update data:', {
      subscription_plan: paymentData.plan_name,
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      subscription_active: true,
      user_id: paymentData.user_id
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
      throw new Error('Failed to update subscription');
    }

    console.log('✅ Subscription activated successfully for user:', paymentData.user_id);
    console.log('Plan:', paymentData.plan_name, 'Valid until:', endDate.toISOString());
    console.log('=== PAYMENT VERIFICATION END ===');

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
    console.error('Error in verify-payment function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});