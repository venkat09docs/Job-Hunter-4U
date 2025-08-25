import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts"

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
    console.log('=== INSTAMOJO WEBHOOK FUNCTION START ===');

    const body = await req.text();
    const formData = new URLSearchParams(body);
    
    const payment_id = formData.get('payment_id');
    const payment_request_id = formData.get('payment_request_id');
    const payment_status = formData.get('payment_status');
    const amount = formData.get('amount');
    const mac = formData.get('mac');

    console.log('Webhook payload:', {
      payment_id,
      payment_request_id,
      payment_status,
      amount,
      mac: mac ? 'present' : 'missing'
    });

    // Validate required environment variables
    const INSTAMOJO_SALT = Deno.env.get('INSTAMOJO_SALT');
    
    if (!INSTAMOJO_SALT) {
      console.error('Missing Instamojo salt for webhook verification');
      return new Response('Missing salt', { status: 500 });
    }

    // Verify webhook authenticity using MAC
    const data = `${payment_id}|${payment_request_id}|${payment_status}|${amount}`;
    const expectedMac = createHash("sha1").update(data + INSTAMOJO_SALT).toString();
    
    if (mac !== expectedMac) {
      console.error('Webhook MAC verification failed');
      console.error('Expected MAC:', expectedMac);
      console.error('Received MAC:', mac);
      return new Response('Invalid MAC', { status: 400 });
    }

    console.log('✅ Webhook MAC verified successfully');

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

    // Only process successful payments
    if (payment_status === 'Credit') {
      console.log('Processing successful payment...');

      // Find the payment record in database
      const { data: paymentRecord, error: fetchError } = await supabaseService
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', payment_request_id)
        .single();

      if (fetchError || !paymentRecord) {
        console.error('Payment record not found:', fetchError);
        return new Response('Payment record not found', { status: 404 });
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
        return new Response('Failed to update payment', { status: 500 });
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
        .eq('user_id', paymentRecord.user_id);

      if (profileError) {
        console.error('Failed to update user subscription:', profileError);
      } else {
        console.log('✅ User subscription updated successfully');
      }
    }

    console.log('✅ Webhook processed successfully');
    console.log('=== INSTAMOJO WEBHOOK FUNCTION END ===');

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('❌ INSTAMOJO WEBHOOK ERROR:', error);
    console.error('Error stack:', error.stack);
    
    return new Response('Internal server error', { status: 500 });
  }
});