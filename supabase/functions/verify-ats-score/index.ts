import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;

  // Handle different endpoints
  if (pathname.endsWith('/analyze') || pathname.endsWith('/verify-ats-score')) {
    return await handleAnalyze(req);
  } else if (pathname.endsWith('/save')) {
    return await handleSave(req);
  } else if (pathname.endsWith('/history')) {
    return await handleHistory(req);
  }

  // Default behavior for backward compatibility
  return await handleAnalyze(req);
});

async function handleAnalyze(req: Request) {
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
    console.error('Error in analyze endpoint:', error);
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
}

async function handleSave(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { resumeName, role, jobDescription, atsScore, analysisResult } = await req.json();

    const { data, error } = await supabase
      .from('ats_score_history')
      .insert([
        {
          user_id: user.id,
          resume_name: resumeName,
          role,
          job_description: jobDescription,
          ats_score: atsScore,
          analysis_result: { content: analysisResult }
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in save endpoint:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleHistory(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const url = new URL(req.url);
    const resumeName = url.searchParams.get('resumeName');

    if (!resumeName) {
      throw new Error('Resume name is required');
    }

    const { data, error } = await supabase
      .from('ats_score_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('resume_name', resumeName)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in history endpoint:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}