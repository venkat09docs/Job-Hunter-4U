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

// Retry function with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to call n8n webhook`);
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // If not ok, throw to retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries reached');
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

    // Call n8n webhook with retry logic
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_JSEARCH_URL') || 'https://n8n.srv995073.hstgr.cloud/webhook/jsearch';
    
    let n8nResponse: Response;
    try {
      n8nResponse = await fetchWithRetry(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });
    } catch (error) {
      console.error('Failed to call n8n webhook after retries:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to call n8n webhook: ${error.message}`,
          jobs: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('n8n response status:', n8nResponse.status);

    // Parse n8n response
    const responseText = await n8nResponse.text();
    console.log('n8n response length:', responseText.length);
    console.log('n8n raw response:', responseText.substring(0, 500)); // Log first 500 chars

    let jobResults = [];
    
    if (!responseText || responseText.trim() === '') {
      console.log('Empty response from n8n webhook');
    } else {
      try {
        const parsedResult = JSON.parse(responseText);
        console.log('Parsed result type:', typeof parsedResult, 'isArray:', Array.isArray(parsedResult));
        
        // Handle different response formats from n8n
        if (Array.isArray(parsedResult)) {
          jobResults = parsedResult;
        } else if (parsedResult.jobs && Array.isArray(parsedResult.jobs)) {
          jobResults = parsedResult.jobs;
        } else if (parsedResult.data && Array.isArray(parsedResult.data)) {
          jobResults = parsedResult.data;
        } else {
          console.log('Unexpected response structure:', Object.keys(parsedResult));
          jobResults = [parsedResult]; // Wrap single object in array
        }
        
        console.log('Successfully extracted jobs:', jobResults.length);
      } catch (parseError) {
        console.error('Error parsing n8n response:', parseError);
        console.error('Response text that failed to parse:', responseText);
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
