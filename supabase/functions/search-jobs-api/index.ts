import { corsHeaders } from '../_shared/cors.ts'

interface JobSearchParams {
  query: string;
  num_pages?: number;
  date_posted?: string;
  country?: string;
  language?: string;
  job_requirements?: string;
  employment_type?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Job search API called');
    
    let searchParams: JobSearchParams;

    // Parse request parameters from query string or body
    if (req.method === 'GET') {
      const url = new URL(req.url);
      searchParams = {
        query: url.searchParams.get('query') || '',
        num_pages: parseInt(url.searchParams.get('num_pages') || '1'),
        date_posted: url.searchParams.get('date_posted') || 'all',
        country: url.searchParams.get('country') || 'us',
        language: url.searchParams.get('language') || 'en',
        job_requirements: url.searchParams.get('job_requirements') || 'under_3_years_experience',
        employment_type: url.searchParams.get('employment_type') || 'FULLTIME',
      };
    } else {
      const body = await req.json();
      searchParams = {
        query: body.query,
        num_pages: body.num_pages || 1,
        date_posted: body.date_posted || 'all',
        country: body.country || 'us',
        language: body.language || 'en',
        job_requirements: body.job_requirements || 'under_3_years_experience',
        employment_type: body.employment_type || 'FULLTIME',
      };
    }
    
    if (!searchParams.query) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: query',
          jobs: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Search parameters:', searchParams);

    // Call n8n webhook
    const n8nWebhookUrl = 'https://n8n.srv995073.hstgr.cloud/webhook/jsearch';
    
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    console.log('n8n response status:', n8nResponse.status);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n webhook error:', errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `n8n webhook failed: ${n8nResponse.status}`,
          jobs: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Parse n8n response
    const responseText = await n8nResponse.text();
    console.log('n8n response length:', responseText.length);

    let jobResults = [];
    
    if (!responseText || responseText.trim() === '') {
      console.log('Empty response from n8n');
    } else {
      try {
        const parsedResult = JSON.parse(responseText);
        jobResults = Array.isArray(parsedResult) ? parsedResult : (parsedResult.jobs || []);
        console.log('Found jobs:', jobResults.length);
      } catch (parseError) {
        console.error('Error parsing n8n response:', parseError);
      }
    }

    // Return job list
    return new Response(
      JSON.stringify({
        success: true,
        jobs: jobResults,
        total: jobResults.length,
        searchParams: searchParams
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in search-jobs-api:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        jobs: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
