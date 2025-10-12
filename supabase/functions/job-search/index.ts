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
  employment_type: string;
  resume_pdf_base64?: string;  // Base64 encoded PDF data
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

    // Parse request parameters from either query string or body
    let query: string;
    let num_pages: number;
    let date_posted: string;
    let country: string;
    let language: string;
    let job_requirements: string;
    let employment_type: string;
    let resume_pdf_base64: string | null;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      query = url.searchParams.get('query') || '';
      num_pages = parseInt(url.searchParams.get('num_pages') || '1');
      date_posted = url.searchParams.get('date_posted') || 'all';
      country = url.searchParams.get('country') || 'us';
      language = url.searchParams.get('language') || 'en';
      job_requirements = url.searchParams.get('job_requirements') || 'under_3_years_experience';
      employment_type = url.searchParams.get('employment_type') || 'FULLTIME';
      resume_pdf_base64 = null;
    } else {
      const body = await req.json();
      query = body.query;
      num_pages = body.num_pages;
      date_posted = body.date_posted;
      country = body.country;
      language = body.language;
      job_requirements = body.job_requirements;
      employment_type = body.employment_type;
      resume_pdf_base64 = body.resume_pdf_base64 || null;
    }
    
    if (!query) {
      throw new Error('Missing required field: query');
    }

    console.log('Job search request:', { query, num_pages, date_posted, country, language, job_requirements, employment_type, hasResumeBase64: !!resume_pdf_base64 });

    if (resume_pdf_base64) {
      console.log('✅ Received PDF base64 from frontend, size:', resume_pdf_base64.length);
    } else {
      console.log('⚠️ No PDF base64 received from frontend');
    }

    // Use the production n8n webhook URL
    const n8nWebhookUrl = 'https://rns.srv995073.hstgr.cloud/webhook/jsearch';

    // Send job search request to n8n
    console.log('📤 Sending to n8n webhook:', n8nWebhookUrl);
    console.log('📦 Payload includes resume_pdf_base64:', !!resume_pdf_base64);
    
    let n8nResponse;
    let n8nResult;
    
    try {
      n8nResponse = await fetch(n8nWebhookUrl, {
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
          job_requirements,
          employment_type,
          resume_pdf_base64
        }),
      });

      console.log('✅ n8n response status:', n8nResponse.status);
      console.log('📊 n8n response status text:', n8nResponse.statusText);

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error('❌ n8n webhook error response:', errorText);
        throw new Error(`n8n webhook failed: ${n8nResponse.status} ${n8nResponse.statusText} - ${errorText}`);
      }

      // Read response as text first to handle empty responses
      const responseText = await n8nResponse.text();
      console.log('n8n response body length:', responseText.length);

      if (!responseText || responseText.trim() === '') {
        console.log('Empty response from n8n webhook, returning empty result');
        n8nResult = { jobs: [] };
      } else {
        try {
          n8nResult = JSON.parse(responseText);
          console.log('n8n job search result:', JSON.stringify(n8nResult).substring(0, 500) + '...');
        } catch (parseError) {
          console.error('Error parsing n8n response:', parseError);
          console.log('Response text:', responseText.substring(0, 200));
          n8nResult = { jobs: [] };
        }
      }
    } catch (fetchError) {
      console.error('Error calling n8n webhook:', fetchError);
      
      // Return empty result when webhook fails
      console.log('n8n webhook failed, returning empty result');
      n8nResult = {
        jobs: []
      };
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
              query,
              num_pages,
              date_posted,
              country,
              language,
              job_requirements,
              employment_type
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
            job_requirements,
            employment_type
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
