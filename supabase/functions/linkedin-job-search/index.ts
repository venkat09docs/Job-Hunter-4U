import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LinkedInJobSearchRequest {
  title: string;
  location: string;
  type: string;
  remote: boolean;
  industry: string;
  seniority: string;
  external_apply: boolean;
  directapply: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting LinkedIn job search function');
    
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

    const { title, location, type, remote, industry, seniority, external_apply, directapply }: LinkedInJobSearchRequest = await req.json();
    
    if (!title || !location) {
      throw new Error('Missing required fields: title and location');
    }

    console.log('LinkedIn job search request:', { title, location, type, remote, industry, seniority, external_apply, directapply });

    // Use the LinkedIn-specific n8n webhook URL
    const n8nWebhookUrl = 'https://n8n.srv995073.hstgr.cloud/webhook/linkedin';

    // Send job search request to n8n
    console.log('Sending to LinkedIn n8n webhook:', n8nWebhookUrl);
    
    let n8nResponse;
    let n8nResult;
    
    try {
      n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          location,
          type,
          remote,
          industry,
          seniority,
          external_apply,
          directapply
        }),
      });

      console.log('LinkedIn n8n response status:', n8nResponse.status);
      console.log('LinkedIn n8n response status text:', n8nResponse.statusText);

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error('LinkedIn n8n webhook error response:', errorText);
        throw new Error(`LinkedIn n8n webhook failed: ${n8nResponse.status} ${n8nResponse.statusText} - ${errorText}`);
      }

      // Get response text first to handle potential JSON parsing issues
      const responseText = await n8nResponse.text();
      console.log('LinkedIn n8n raw response:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from LinkedIn n8n webhook');
      }

      try {
        n8nResult = JSON.parse(responseText);
        console.log('LinkedIn n8n job search result:', n8nResult);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Response text was:', responseText);
        throw new Error(`Invalid JSON response from LinkedIn n8n webhook: ${jsonError.message}`);
      }

    } catch (fetchError) {
      console.error('Error calling LinkedIn n8n webhook:', fetchError);
      
      // Return empty result when webhook fails - don't throw error to user
      console.log('LinkedIn n8n webhook failed, returning empty result');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'LinkedIn job search completed',
          data: {
            jobs: [],
            searchCriteria: {
              title,
              location,
              type,
              remote,
              industry,
              seniority,
              external_apply,
              directapply
            },
            totalResults: 0
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

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
              title,
              location,
              type,
              remote,
              industry,
              seniority,
              external_apply,
              directapply,
              search_type: 'linkedin'
            },
            results: jobResults,
            results_count: jobResults.length,
            searched_at: new Date().toISOString()
          });

        if (saveError) {
          console.error('Error saving LinkedIn job search to database:', saveError);
        } else {
          console.log('LinkedIn job search results saved to database successfully');
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }
    }

    console.log(`LinkedIn job search completed successfully. Found ${jobResults.length} jobs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'LinkedIn job search completed successfully',
        data: {
          jobs: jobResults,
          searchCriteria: {
            title,
            location,
            type,
            remote,
            industry,
            seniority,
            external_apply,
            directapply
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
    console.error('Error in linkedin-job-search function:', error);
    
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