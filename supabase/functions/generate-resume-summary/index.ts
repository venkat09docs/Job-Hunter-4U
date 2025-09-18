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
    const { skills, achievements, total_years_of_exp, relevant_exp } = await req.json();

    if (!skills || !achievements || !total_years_of_exp || !relevant_exp) {
      return new Response(
        JSON.stringify({ error: 'All fields are required: skills, achievements, total_years_of_exp, relevant_exp' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `write the resume's only professional summary to include more action verbs. Include at least four keywords from the skills ${skills} and achievements ${achievements}. 

Write no more than 400 characters and include his total experience ${total_years_of_exp} and relevant experience ${relevant_exp}

Write Summary in the following Format in 50 words:

"I am a X professional with Y years of experience in helping organizations achieve their business achievements of A, through my skills in X. In the last ${relevant_exp} years I've achieved X by Y."`;

    console.log('Generating resume summary with prompt:', prompt);

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
            content: 'You are an expert resume writer. Generate professional, concise, and impactful resume summaries that highlight key skills and achievements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate resume summary', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedSummary = data.choices[0].message.content;

    console.log('Generated summary:', generatedSummary);

    return new Response(
      JSON.stringify({ summary: generatedSummary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-resume-summary function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});