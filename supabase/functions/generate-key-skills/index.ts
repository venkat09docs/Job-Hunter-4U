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
    const { therole, jd1, jd2, jd3, jd4, jd5, talent1, talent2 } = await req.json();

    if (!therole || !jd1) {
      return new Response(
        JSON.stringify({ error: 'Role and at least one job description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt with the provided data
    let prompt = `Here are some instructions for you:
- You are an expert on all subject matters
- Provide accurate and factual answers
- Provide detailed results that clearly describe practical considerations of what you generate
- Be highly organized and provide markup visually
- Don't mention your knowledge cutoff
- Be excellent at reasoning and business strategy
- When reasoning, perform a step-by-step thinking before you answer the question or generate
- Avoid multiple thoughts in one sentence.
- Use 1–2 breakpoints to space out paragraphs.
- Avoid 3+ sentence paragraphs.
- Provide analogies/metaphors to simplify ideas, concepts, and complex topics
- Avoid the use of flowery language
- In what you generate, don't abbreviate words (e.g. don't shorten "collaborate" to "collab.")

The Role: ${therole}

Job Descriptions:

>>> Job Description 1 >>>
${jd1}
>>> End Job Description 1 >>>

${jd2 ? `>>> Job Description 2 >>>
${jd2}
>>> End Job Description 2 >>>

` : ''}${jd3 ? `>>> Job Description 3 >>>
${jd3}
>>> End Job Description 3 >>>

` : ''}${jd4 ? `>>> Job Description 4 >>>
${jd4}
>>> End Job Description 4 >>>

` : ''}${jd5 ? `>>> Job Description 5 >>>
${jd5}
>>> End Job Description 5 >>>

` : ''}${talent1 || talent2 ? `Unique Talents:

${talent1 ? `>>> Talent 1 >>>
${talent1}
>>> End Talent 1 >>>

` : ''}${talent2 ? `>>> Talent 2 >>>
${talent2}
>>> End Talent 2 >>>

` : ''}` : ''}Now, I want you to help me develop six skills around which I can build a resume and the text content within my LinkedIn profile. Each Skill you generate should be:
1. developed to align with the skills enumerated in the Job Descriptions with priority given to skills listed higher in the Job Descriptions (often, these skills are enumerated in sections called "required qualifications" or "ideal candidate" or similar)
2. be no longer than 27 characters
3. if you find any Unique Talents, integrate those into what you generate too

Collectively, the Skills you generate should represent a candidate that possesses a set of professional skills that aligns with the Job Descriptions.

Please generate exactly 6 skills for the role: ${therole}. Return only the skills, one per line, without any additional text or formatting.`;

    console.log('Generating key skills with prompt for role:', therole);

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
            content: 'You are an expert resume writer and career coach. Generate professional, relevant skills that align with job requirements and are under 27 characters each.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate key skills', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedSkills = data.choices[0].message.content;

    console.log('Generated skills:', generatedSkills);

    return new Response(
      JSON.stringify({ skills: generatedSkills }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-key-skills function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});