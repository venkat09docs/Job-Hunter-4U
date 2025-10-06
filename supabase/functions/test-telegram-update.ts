// Temporary script to test telegram chat ID update
// Run this once to update the user's telegram_chat_id

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = "https://moirryvajzyriagqihbe.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Update telegram_chat_id directly
const { data, error } = await supabase
  .from('profiles')
  .update({ telegram_chat_id: '1398708101' })
  .eq('email', 'g.venkat09@gmail.com')
  .select();

if (error) {
  console.error('Error:', error);
} else {
  console.log('Success! Updated user:', data);
}
