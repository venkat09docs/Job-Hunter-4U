import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobSearchRequest {
  jobTitle: string;
  location: string;
  experienceLevel: string;
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting job search function');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set the auth context
    const token = authHeader.replace('Bearer ', '');
    await supabaseClient.auth.setSession({
      access_token: token,
      refresh_token: '',
    });

    const { jobTitle, location, experienceLevel, userId }: JobSearchRequest = await req.json();
    
    if (!jobTitle || !userId) {
      throw new Error('Missing required fields: jobTitle and userId');
    }

    console.log('Job search request:', { jobTitle, location, experienceLevel, userId });

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      throw new Error('N8N_WEBHOOK_URL not configured');
    }

    // Send job search request to n8n
    console.log('Sending to n8n webhook:', n8nWebhookUrl);
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobTitle,
        location,
        experienceLevel,
        userId,
        action: 'job_search'
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    const n8nResult = await n8nResponse.json();
    console.log('n8n job search result:', n8nResult);

    // Process the job search results
    const jobResults = n8nResult.jobs || [];

    console.log(`Job search completed successfully. Found ${jobResults.length} jobs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job search completed successfully',
        data: {
          jobs: jobResults,
          searchCriteria: {
            jobTitle,
            location,
            experienceLevel
          },
          totalResults: jobResults.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in job-search function:', error);
    
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