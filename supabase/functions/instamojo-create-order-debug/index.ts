import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('=== INSTAMOJO DEBUG FUNCTION START ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Body parsing error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: parseError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { amount, plan_name, plan_duration } = requestBody;
    console.log('Extracted params:', { amount, plan_name, plan_duration });

    // Validate required fields
    if (!amount || !plan_name || !plan_duration) {
      console.error('Missing required fields:', { amount, plan_name, plan_duration });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['amount', 'plan_name', 'plan_duration'],
          received: { amount, plan_name, plan_duration }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check environment variables
    const INSTAMOJO_API_KEY = Deno.env.get('INSTAMOJO_API_KEY');
    const INSTAMOJO_AUTH_TOKEN = Deno.env.get('INSTAMOJO_AUTH_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment variables check:', {
      INSTAMOJO_API_KEY: !!INSTAMOJO_API_KEY,
      INSTAMOJO_AUTH_TOKEN: !!INSTAMOJO_AUTH_TOKEN,
      SUPABASE_URL: !!SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY
    });

    if (!INSTAMOJO_API_KEY || !INSTAMOJO_AUTH_TOKEN) {
      console.error('Missing Instamojo credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Missing Instamojo credentials',
          env_check: {
            INSTAMOJO_API_KEY: !!INSTAMOJO_API_KEY,
            INSTAMOJO_AUTH_TOKEN: !!INSTAMOJO_AUTH_TOKEN
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check authorization header
    const authHeader = req.headers.get('authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    let supabaseService;
    try {
      supabaseService = createClient(
        SUPABASE_URL ?? '',
        SUPABASE_SERVICE_ROLE_KEY ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      console.log('✅ Supabase client initialized');
    } catch (supabaseError) {
      console.error('Supabase client error:', supabaseError);
      return new Response(
        JSON.stringify({ 
          error: 'Database connection failed',
          details: supabaseError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user from JWT token
    let user;
    try {
      const jwt = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabaseService.auth.getUser(jwt);

      if (userError || !userData.user) {
        console.error('Invalid user token:', userError);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid authorization token',
            details: userError?.message || 'User not found'
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      user = userData;
      console.log('✅ User authenticated:', user.user.id);
    } catch (authError) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: authError.message 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return success response with debug info
    const response = {
      success: true,
      debug_info: {
        user_id: user.user.id,
        amount: amount,
        plan_name: plan_name,
        plan_duration: plan_duration,
        env_vars_ok: true,
        auth_ok: true,
        supabase_ok: true
      },
      message: 'Debug function completed successfully'
    };

    console.log('✅ Debug function successful:', response);
    console.log('=== INSTAMOJO DEBUG FUNCTION END ===');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ DEBUG FUNCTION ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        name: error.name,
        message: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});