import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, location, keywords, frequency, userId } = await req.json();
    
    console.log('LinkedIn automation request:', { jobTitle, location, keywords, frequency, userId });

    // Here you would integrate with your n8n webhook for LinkedIn automation
    // For now, we'll return a success response
    const mockResponse = {
      success: true,
      message: 'LinkedIn automation activated successfully',
      settings: {
        jobTitle,
        location,
        keywords,
        frequency
      },
      automationId: `linkedin_${userId}_${Date.now()}`
    };

    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in linkedin-automation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});