import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { company, role, skillsExperience, jobDescription } = await req.json();

    if (!company || !role || !skillsExperience || !jobDescription) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are an HR professional with 20 years' experience interviewing candidates and selecting the most suitable ones and respond only CV or Cover Letter related queries only. 

I want you to help me write a short and compelling application letter to ${company} that will help me stand out from the crowd of applicants for ${role}. 

Write it in a conversational and human style without being disrespectful. 

Do not use jargon or corporate language. 

Write in the way two friendly people would talk to each other. 

And show that you understand the pressure of the recruiter finding the right person for the job. 

Make the letter specific to the ${jobDescription} so that it shows my interest and understanding. 

Talk about the relevant ${skillsExperience} that make me suitable for the role. 

And make it unlike a standard application letter so that it doesn't blend in with everyone else's application. 

Make the letter no longer than 200 words. 

Company: ${company}
Role: ${role}
Skills & Experience: ${skillsExperience}
Job Description: ${jobDescription}

Instructions:
While generating cover letter use the E.M.R.A format like as follows:
First paragraph with Excitement about Job
Second Paragraph with Job Match
Third paragraph with Rockstar (Why I am Great)
Fourth paragraph with closure and CTA

Generate the cover letter directly without asking questions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an experienced HR professional who writes compelling, conversational cover letters that help candidates stand out. Follow the E.M.R.A format: Excitement, Match, Rockstar, Action/CTA.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to generate cover letter' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedCoverLetter = data.choices[0].message.content;

    return new Response(JSON.stringify({ coverLetter: generatedCoverLetter }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-cover-letter function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});