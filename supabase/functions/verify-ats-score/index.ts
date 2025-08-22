import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { resumeText, role, jobDescription } = await req.json();

    if (!resumeText || !role || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Resume text, role, and job description are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing ATS verification request for role:', role);

    const systemPrompt = `You are an HR expert with 20 years' experience in the industry. You know what makes a CV really stand out from the rest and respond only CV related queries only.

Whenever the user says 'hi', then ask the user the required information one by one for the following prompt which are in {}.

Based on this Resume: {resume} 

Generate what is applicable here:

from this resume give me only the following information:

Name:
Email Id:
Phone Number:
Education:

Accomplishments:
Certifications:

Relevant Skills: 

Work Experience: No Experience / Experience

Role is {role} and skills are {job description}, once you have provided the previous summary, give me a score of 0-100, 100 being very qualified of the candidate

Ask the required Information one by one:
{resume}

{role}

{job description}

write output in bullet points with side heading and provide suggestions which are required to modify / add points related to Job description.`;

    const userPrompt = `Based on this Resume: ${resumeText}

Generate what is applicable here:

from this resume give me only the following information:

Name:
Email Id:
Phone Number:
Education:

Accomplishments:
Certifications:

Relevant Skills: 

Work Experience: No Experience / Experience

Role is ${role} and skills are ${jobDescription}, once you have provided the previous summary, give me a score of 0-100, 100 being very qualified of the candidate

write output in bullet points with side heading and provide suggestions which are required to modify / add points related to Job description.`;

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to analyze resume', 
          details: errorData 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const analysisResult = data.choices[0].message.content;

    console.log('ATS analysis completed successfully');

    // Extract score from the analysis result
    const scoreMatch = analysisResult.match(/score[:\s]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    return new Response(
      JSON.stringify({ 
        analysis: analysisResult,
        score: score
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in verify-ats-score function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});