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

// Function to verify Razorpay signature
async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const text = `${orderId}|${paymentId}`;
  const expectedSignature = await generateSignature(text, secret);
  return expectedSignature === signature;
}

async function generateSignature(text: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const textData = encoder.encode(text);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, textData);
  const signatureArray = new Uint8Array(signature);
  return Array.from(signatureArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.id) {
      console.error('Authentication error:', userError);
      throw new Error('User not authenticated');
    }
    
    const userId = userData.user.id;
    console.log('Authenticated user:', userId);

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
    const isValidSignature = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpayKeySecret);
    
    if (!isValidSignature) {
      throw new Error('Invalid payment signature');
    }

    // Use service role to update payment and subscription details
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get the payment record to fetch plan details
    const { data: paymentData, error: fetchError } = await supabaseService
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !paymentData) {
      console.error('Payment fetch error:', fetchError);
      console.log('Order ID:', razorpay_order_id, 'User ID:', userId);
      throw new Error('Payment record not found');
    }
    
    console.log('Found payment record:', paymentData.id);

    // Update payment status with verification details
    const { error: updateError } = await supabaseService
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (updateError) {
      console.error('Payment update error:', updateError);
      throw new Error('Failed to update payment status');
    }

    // Calculate subscription dates - use upgrade_end_date if provided (for upgrades with remaining days)
    const startDate = new Date();
    const endDate = upgrade_end_date ? new Date(upgrade_end_date) : calculateSubscriptionEndDate(paymentData.plan_duration);

    console.log('Subscription dates:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      isUpgrade: !!upgrade_end_date 
    });

    // Update user profile with subscription details
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
      console.error('Profile update error:', profileError);
      throw new Error('Failed to update subscription');
    }

    console.log('Payment verified and subscription updated for user:', paymentData.user_id);
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