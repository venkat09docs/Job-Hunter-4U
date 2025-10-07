import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOK_URL = 'https://n8n.srv995073.hstgr.cloud/webhook-test/8d5c183b-a4b2-4431-9111-c1ab729bd600';

interface UpdateTelegramRequest {
  email: string;
  telegram_chat_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, telegram_chat_id }: UpdateTelegramRequest = await req.json();

    if (!email || !telegram_chat_id) {
      return new Response(
        JSON.stringify({ error: 'Email and telegram_chat_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate telegram_chat_id length (typically 8-10 digits)
    if (telegram_chat_id.length < 8 || telegram_chat_id.length > 12) {
      return new Response(
        JSON.stringify({ error: 'Invalid telegram_chat_id length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Updating telegram_chat_id for email: ${email}`);

    // Update the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .update({ telegram_chat_id })
      .eq('email', email)
      .select('user_id, email, username, telegram_chat_id');

    if (error) {
      console.error('Error updating telegram_chat_id:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found with that email' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully updated telegram_chat_id:', data);

    const userData = data[0];

    // Call n8n webhook AFTER updating profiles table
    try {
      const webhookPayload = {
        email: userData.email,
        telegram_chat_id: userData.telegram_chat_id,
        user_id: userData.user_id,
        timestamp: new Date().toISOString(),
        username: userData.username || ''
      };

      console.log('Calling n8n webhook with payload:', webhookPayload);

      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        console.error('n8n webhook call failed:', webhookResponse.status, webhookResponse.statusText);
        // Don't fail the request if webhook fails, DB update succeeded
      } else {
        console.log('n8n webhook called successfully');
      }
    } catch (webhookError) {
      console.error('Error calling n8n webhook:', webhookError);
      // Don't fail the request if webhook fails, DB update succeeded
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Telegram chat ID updated successfully',
        user: userData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-telegram-chat-id function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
