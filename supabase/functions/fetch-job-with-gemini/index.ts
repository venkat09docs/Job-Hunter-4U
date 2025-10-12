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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!pageResponse.ok) {
      console.error('Failed to fetch page:', pageResponse.status, pageResponse.statusText);
      throw new Error(`Failed to fetch job page: ${pageResponse.status}`);
    }

    const htmlContent = await pageResponse.text();
    console.log('Fetched HTML content, length:', htmlContent.length);

    // Clean and extract text from HTML
    const cleanText = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const textToAnalyze = cleanText.substring(0, 10000); // Limit to 10k chars
    console.log('Cleaned text length:', textToAnalyze.length);

    // Use Gemini to extract job details
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found in environment');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Calling Gemini API...');
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
            content: 'You are a job details extractor. Analyze the content and determine if it contains a single job posting or multiple job listings. Return ONLY valid JSON in this format: {"isSingleJob": boolean, "jobs": [array of job objects]}. Each job object must have: jobTitle, companyName, location, jobType, salary, description, requirements, responsibilities, benefits, applicationDeadline, contactEmail, applyLink. Use null for missing fields.'
          },
          {
            role: 'user',
            content: `Analyze this content and extract all job postings. If it's a single job page, return one job in the array. If it's a job listings page, extract all jobs:\n\n${textToAnalyze}\n\nReturn ONLY a JSON object with "isSingleJob" (boolean) and "jobs" (array) fields.`
          }
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received');

    let extractedData;
    const content = geminiData.choices[0].message.content;
    
    // Try to parse JSON from the response
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      // Try to extract JSON from the content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract valid JSON from AI response');
      }
    }

    console.log('Successfully extracted job details');

    // Validate the response structure
    if (!extractedData.jobs || !Array.isArray(extractedData.jobs)) {
      throw new Error('Invalid response format from AI');
    }

    console.log(`Successfully extracted ${extractedData.jobs.length} job(s)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        isSingleJob: extractedData.isSingleJob || false,
        jobs: extractedData.jobs 
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
        error: error.message || 'An error occurred while fetching job details'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
