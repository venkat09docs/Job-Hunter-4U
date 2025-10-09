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
    const binaryString = atob(resumeBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Import and use mammoth for text extraction
    let resumeText = '';
    
    try {
      const mammoth = await import('https://esm.sh/mammoth@1.8.0');
      const result = await mammoth.extractRawText({ 
        arrayBuffer: bytes.buffer 
      });
      
      resumeText = result.value.trim();
      
      console.log('Text extraction successful. Length:', resumeText.length);
      console.log('First 200 chars:', resumeText.substring(0, 200));
      
      if (!resumeText || resumeText.length < 50) {
        throw new Error('Extracted text is too short. Please ensure the document contains text content.');
      }
    } catch (extractError) {
      console.error('Error during text extraction:', extractError);
      throw new Error(`Failed to extract text from Word document: ${extractError.message}`);
    }

    // Prepare the analysis prompt - don't include resume text in response
    const systemPrompt = `You are an expert resume analyzer and career coach. Provide a comprehensive analysis in a structured format with clear sections. Use markdown formatting for better readability.`;

    const userPrompt = `You are analyzing a resume against a job description. Here is the actual resume content I extracted:

RESUME TEXT START:
${resumeText}
RESUME TEXT END

JOB DESCRIPTION:
${jobDescription}

Based on this actual resume content above, provide your analysis in the following structured format:

## Match Score
[Score out of 100] - [Brief justification in 1-2 sentences]

## Key Strengths
- [Strength 1]
- [Strength 2]
- [Strength 3]
- [Strength 4]
- [Strength 5]

## Gaps & Missing Qualifications
- [Gap 1]
- [Gap 2]
- [Gap 3]
- [Gap 4]

## Optimization Suggestions
- [Suggestion 1]
- [Suggestion 2]
- [Suggestion 3]
- [Suggestion 4]
- [Suggestion 5]

## Recommended Keywords
- [Keyword 1]
- [Keyword 2]
- [Keyword 3]
- [Keyword 4]
- [Keyword 5]

## Overall Recommendation
[Provide a brief 2-3 sentence summary and next steps]

Important: Do NOT include or repeat the resume content in your analysis. Only provide the analysis itself.`;

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
