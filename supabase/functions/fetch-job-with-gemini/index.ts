import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobUrl } = await req.json();

    if (!jobUrl) {
      throw new Error('Job URL is required');
    }

    console.log('Fetching job details from URL:', jobUrl);

    // Fetch the webpage content
    const pageResponse = await fetch(jobUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch job page: ${pageResponse.status}`);
    }

    const htmlContent = await pageResponse.text();

    // Use Gemini to extract job details
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a job details extractor. Extract structured job information from HTML content and return it as clean JSON with these fields: jobTitle, companyName, location, jobType, salary, description, requirements, responsibilities, benefits, applicationDeadline, contactEmail. If a field is not found, use null.'
          },
          {
            role: 'user',
            content: `Extract job details from this HTML content:\n\n${htmlContent.substring(0, 15000)}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const extractedData = JSON.parse(geminiData.choices[0].message.content);

    console.log('Successfully extracted job details:', extractedData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobDetails: extractedData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-job-with-gemini:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
