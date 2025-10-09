import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeBase64, jobDescription } = await req.json();
    
    if (!resumeBase64 || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Resume and job description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Starting Word document text extraction...');

    // Decode base64 to binary
    const binaryData = Uint8Array.from(atob(resumeBase64), c => c.charCodeAt(0));
    
    // Extract text from Word document using mammoth
    const mammoth = await import('https://esm.sh/mammoth@1.6.0');
    const result = await mammoth.extractRawText({ arrayBuffer: binaryData.buffer });
    const resumeText = result.value;

    console.log('Extracted text length:', resumeText.length);

    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error('Could not extract text from document or document is too short');
    }

    // Prepare the analysis prompt - don't include resume text in response
    const systemPrompt = `You are an expert resume analyzer and career coach. Provide a comprehensive analysis in a structured format with clear sections. Use markdown formatting for better readability.`;

    const userPrompt = `Analyze this resume against the job description below.

**Job Description:**
${jobDescription}

**Resume Content:**
${resumeText}

Provide your analysis in the following structure:

## Match Score
Provide an overall match score out of 100 with a brief justification.

## Key Strengths
List the top 3-5 strengths that align well with the job requirements.

## Gaps & Missing Qualifications
Identify what's missing or could be improved to better match the job description.

## Optimization Suggestions
Provide 5-7 specific, actionable recommendations to improve the resume for this role.

## Recommended Keywords
List important keywords from the job description that should be incorporated into the resume.

## Overall Recommendation
Provide a brief summary and next steps.

Keep the analysis focused, actionable, and professional. Do NOT repeat the resume content in your response.`;

    console.log('Sending request to Gemini...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error("No analysis generated");
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});