import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobSearchRequest {
  query: string;
  num_pages: number;
  date_posted: string;
  country: string;
  language: string;
  job_requirements: string;
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

    const { query, num_pages, date_posted, country, language, job_requirements }: JobSearchRequest = await req.json();
    
    if (!query) {
      throw new Error('Missing required field: query');
    }

    console.log('Job search request:', { query, num_pages, date_posted, country, language, job_requirements });

    // Use the specific n8n webhook URL you provided
    const n8nWebhookUrl = 'https://rnstech.app.n8n.cloud/webhook/find-next-job-role';

    // Send job search request to n8n
    console.log('Sending to n8n webhook:', n8nWebhookUrl);
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        num_pages,
        date_posted,
        country,
        language,
        job_requirements
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    const n8nResult = await n8nResponse.json();
    console.log('n8n job search result:', n8nResult);

    // Process the job search results
    const jobResults = Array.isArray(n8nResult) ? n8nResult : (n8nResult.jobs || []);

    // Get the authenticated user
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (user) {
      // Save the search results to database
      try {
        const { error: saveError } = await supabaseClient
          .from('job_searches')
          .insert({
            user_id: user.id,
            search_query: {
              query,
              num_pages,
              date_posted,
              country,
              language,
              job_requirements
            },
            results: jobResults,
            results_count: jobResults.length,
            searched_at: new Date().toISOString()
          });

        if (saveError) {
          console.error('Error saving job search to database:', saveError);
        } else {
          console.log('Job search results saved to database successfully');
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }
    }

    console.log(`Job search completed successfully. Found ${jobResults.length} jobs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job search completed successfully',
        data: {
          jobs: jobResults,
          searchCriteria: {
            query,
            num_pages,
            date_posted,
            country,
            language,
            job_requirements
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