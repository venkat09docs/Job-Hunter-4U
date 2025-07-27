import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResumeParseRequest {
  resumeUrl: string;
  userId: string;
}

interface ParsedResumeData {
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    description?: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting resume parsing function');
    
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

    const { resumeUrl, userId }: ResumeParseRequest = await req.json();
    
    if (!resumeUrl || !userId) {
      throw new Error('Missing required fields: resumeUrl and userId');
    }

    console.log('Processing resume for user:', userId);

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      throw new Error('N8N_WEBHOOK_URL not configured');
    }

    // Send resume URL to n8n for parsing
    console.log('Sending to n8n webhook:', n8nWebhookUrl);
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeUrl,
        userId,
        action: 'parse_resume'
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    const n8nResult = await n8nResponse.json();
    console.log('n8n parsing result:', n8nResult);

    // Extract parsed data from n8n response
    const parsedData: ParsedResumeData = {
      summary: n8nResult.summary || 'Resume parsed successfully',
      skills: n8nResult.skills || [],
      experience: n8nResult.experience || [],
      education: n8nResult.education || []
    };

    // Update or create portfolio record
    const { data: existingPortfolio, error: fetchError } = await supabaseClient
      .from('portfolios')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing portfolio:', fetchError);
    }

    let portfolioData;
    if (existingPortfolio) {
      // Update existing portfolio
      const { data, error } = await supabaseClient
        .from('portfolios')
        .update({
          resume_url: resumeUrl,
          parsed_summary: parsedData.summary,
          skills: parsedData.skills,
          experience: parsedData.experience,
          education: parsedData.education,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      portfolioData = data;
    } else {
      // Create new portfolio
      const { data, error } = await supabaseClient
        .from('portfolios')
        .insert({
          user_id: userId,
          resume_url: resumeUrl,
          parsed_summary: parsedData.summary,
          skills: parsedData.skills,
          experience: parsedData.experience,
          education: parsedData.education
        })
        .select()
        .single();

      if (error) throw error;
      portfolioData = data;
    }

    console.log('Portfolio updated successfully:', portfolioData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Resume parsed and portfolio updated successfully',
        data: portfolioData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in parse-resume function:', error);
    
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