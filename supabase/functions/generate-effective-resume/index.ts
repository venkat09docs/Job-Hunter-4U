import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    console.error('OpenAI API key not found');
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { currentjobtitle, shortsummary, keyskillsofexpertise, mostrecentjobtitle, education, certifications } = await req.json();

    if (!currentjobtitle || !shortsummary || !keyskillsofexpertise || !mostrecentjobtitle || !education || !certifications) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Instructions:

You are an HR expert with 20 years' experience in the industry. 

You know what makes a Resume really stand out from the rest and respond only Resume related queries only. 

Please generate the following resume based on this format:

[Full Name] 
[Current Job Title | Additional Title if applicable]
[Phone Number] | [Email Address] | [LinkedIn Profile URL]

EXECUTIVE SUMMARY
[Short summary about professional expertise and major achievements, focusing on years of experience, key areas of expertise, and significant accomplishments]

AREAS OF EXPERTISE & SKILLS
[List of Key Skills and Expertise Areas]

PROFESSIONAL WORK EXPERIENCE

[Most Recent Job Title] -- [Company Name]   [Start Date] – [End Date]

[Brief description of roles and responsibilities]
[Key achievements or projects]
[Previous Job Title] -- [Company Name]   [Start Date] – [End Date]

[Brief description of roles and responsibilities]
[Key achievements or projects]
[Earlier Job Title] -- [Company Name]   [Start Date] – [End Date]

[Brief description of roles and responsibilities]
[Key achievements or projects]
EDUCATION
[Degree], [Major] -- [University Name]

CERTIFICATIONS
[List of relevant certifications]

###

Use my information below.

My information:

Current Job Title: ${currentjobtitle}

Short Summary: ${shortsummary}

Skills: ${keyskillsofexpertise}

Most recent Job: ${mostrecentjobtitle}

Education: ${education}

Certifications: ${certifications}

Please fill in the format of the template with my information and add additional industry related information where it needs it to pad it up.`;

    console.log('Generating effective resume with prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional with 20 years of experience. Generate professional, effective resumes that stand out.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate resume', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedResume = data.choices[0].message.content;

    console.log('Generated resume:', generatedResume);

    return new Response(
      JSON.stringify({ resume: generatedResume }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-effective-resume function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});