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
    const { resumeBase64, jobDescription, keySkills } = await req.json();
    
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

    // Prepare the prompt for redefining the resume
    const systemPrompt = `You are an expert resume writer and career coach. Your task is to redefine and optimize resumes to match specific job descriptions while maintaining authenticity and professionalism.`;

    const keySkillsList = keySkills && keySkills.length > 0 ? keySkills.join(', ') : 'Not specified';

    const userPrompt = `Redefine and optimize the following resume to achieve at least an 80% match with the provided job description.

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

KEY SKILLS TO HIGHLIGHT:
${keySkillsList}

INSTRUCTIONS:
1. Rewrite the Professional Summary to align with the job requirements and emphasize relevant experience
2. Update the Skills section to prominently feature the key skills mentioned in the job description
3. Modify the Experience section:
   - Reframe roles and responsibilities to highlight relevant achievements
   - Use action verbs and quantifiable results
   - Emphasize experiences that match the job requirements
4. Update the Education section if needed to highlight relevant qualifications
5. Maintain the original structure and format
6. Keep all dates, company names, and factual information accurate
7. Make the resume ATS-friendly by incorporating keywords from the job description naturally
8. Ensure the total length is appropriate (1-2 pages)

OUTPUT FORMAT:
Provide the redefined resume in a clean, professional format that can be easily copied. Use the following structure:

[FULL NAME]
[Contact Information]

PROFESSIONAL SUMMARY
[Optimized professional summary - 3-4 sentences]

KEY SKILLS
[List of skills, prioritizing those from the job description]

PROFESSIONAL EXPERIENCE
[Company Name] - [Job Title]
[Dates]
• [Achievement/responsibility that matches job requirements]
• [Achievement/responsibility that matches job requirements]
• [Achievement/responsibility that matches job requirements]

EDUCATION
[Degree] - [Institution]
[Year]

[Additional sections as needed: Certifications, Projects, etc.]

Make sure to:
- Highlight the key skills: ${keySkillsList}
- Use industry-standard terminology from the job description
- Maintain authenticity while optimizing for the role
- Make it compelling and results-oriented`;

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
        max_tokens: 4000,
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
    const redefinedResume = data.choices?.[0]?.message?.content;

    if (!redefinedResume) {
      throw new Error("No redefined resume generated");
    }

    console.log('Resume redefinition completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        redefinedResume 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in redefine-resume function:', error);
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
