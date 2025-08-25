import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('=== INSTAMOJO TEST FUNCTION START ===');

    // Check environment variables
    const INSTAMOJO_API_KEY = Deno.env.get('INSTAMOJO_API_KEY');
    const INSTAMOJO_AUTH_TOKEN = Deno.env.get('INSTAMOJO_AUTH_TOKEN');
    
    console.log('Environment check:', {
      api_key_exists: !!INSTAMOJO_API_KEY,
      auth_token_exists: !!INSTAMOJO_AUTH_TOKEN
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Instamojo test function is working',
        env_check: {
          api_key_exists: !!INSTAMOJO_API_KEY,
          auth_token_exists: !!INSTAMOJO_AUTH_TOKEN
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ TEST FUNCTION ERROR:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Test function error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});