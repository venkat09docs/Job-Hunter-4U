import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramAuthRequest {
  telegramData: TelegramAuthData;
  userId: string;
}

function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...checkData } = data;
  
  // Create data-check-string
  const dataCheckString = Object.keys(checkData)
    .sort()
    .map(key => `${key}=${checkData[key as keyof typeof checkData]}`)
    .join('\n');
  
  // Create secret key from bot token
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  // Create hash
  const calculatedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    if (!telegramBotToken) {
      return new Response(
        JSON.stringify({ error: 'Telegram bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { telegramData, userId }: TelegramAuthRequest = await req.json();

    if (!telegramData || !userId) {
      return new Response(
        JSON.stringify({ error: 'Telegram data and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify Telegram authentication data
    const isValid = verifyTelegramAuth(telegramData, telegramBotToken);
    
    if (!isValid) {
      console.error('Invalid Telegram authentication data');
      return new Response(
        JSON.stringify({ error: 'Invalid Telegram authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check auth_date is recent (within 24 hours)
    const authDate = new Date(telegramData.auth_date * 1000);
    const now = new Date();
    const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return new Response(
        JSON.stringify({ error: 'Authentication data expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Linking Telegram ID ${telegramData.id} to user ${userId}`);

    // Update the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        telegram_chat_id: telegramData.id.toString()
      })
      .eq('user_id', userId)
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
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully linked Telegram account');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Telegram account linked successfully',
        telegram_user: {
          id: telegramData.id,
          username: telegramData.username,
          first_name: telegramData.first_name
        }
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
