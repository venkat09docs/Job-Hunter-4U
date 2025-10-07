import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log(`Updating telegram_chat_id for email: ${email}`);

    // Update the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .update({ telegram_chat_id })
      .eq('email', email)
      .select();

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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Telegram chat ID updated successfully',
        user: data[0]
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
